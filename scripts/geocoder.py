"""Development-only Photon adapter. One request at a time, explicit search, disk cache."""
import hashlib, json, os, subprocess, tempfile, threading, time
from pathlib import Path
from urllib.parse import urlencode, urlparse

class GeocodeError(Exception):
    def __init__(self, message, status=503):
        super().__init__(message)
        self.status = status

class Geocoder:
    def __init__(self, endpoint=None, cache=None, transport=None, clock=time.monotonic, sleep=time.sleep):
        self.endpoint = endpoint or os.environ.get('JSOP_PHOTON_URL', 'https://photon.komoot.io/api/')
        if urlparse(self.endpoint).scheme != 'https':
            raise ValueError('JSOP_PHOTON_URL debe usar HTTPS')
        self.cache = Path(cache or Path(tempfile.gettempdir()) / 'jsop-photon-cache')
        self.cache.mkdir(exist_ok=True)
        self.transport = transport or self.fetch
        self.clock, self.sleep = clock, sleep
        self.lock = threading.Lock()
        self.next_request = 0
        self.cooldown = 0

    def fetch(self, url):
        result = subprocess.run(['curl','--silent','--show-error','--max-time','15','--proto','=https','--user-agent','JSOP-Atlas-Development/2.0 (local architectural exhibition editor)','--write-out','\n%{http_code}',url], capture_output=True, check=True)
        body, status = result.stdout.rsplit(b'\n',1)
        return int(status), body

    def search(self, query):
        query = ' '.join(query.split())
        if not 3 <= len(query) <= 180:
            raise GeocodeError('Escribe entre 3 y 180 caracteres.',400)
        key = hashlib.sha256((self.endpoint+query.casefold()).encode()).hexdigest()
        path = self.cache / key
        with self.lock:
            if path.exists() and time.time()-path.stat().st_mtime < 7*86400:
                try: return json.loads(path.read_text())
                except (ValueError,OSError): pass
            if self.clock() < self.cooldown:
                raise GeocodeError('El buscador está temporalmente limitado. Usa el mapa o intenta más tarde.',429)
            self.sleep(max(0,self.next_request-self.clock()))
            self.next_request = self.clock()+1.1
            try:
                status, body = self.transport(self.endpoint+'?'+urlencode({'q':query,'limit':5}))
                if status == 429:
                    self.cooldown=self.clock()+60
                    raise GeocodeError('El proveedor limitó la búsqueda. Espera un minuto o selecciona el mapa.',429)
                if status != 200: raise GeocodeError('El buscador no está disponible. Selecciona el punto manualmente.')
                data=json.loads(body)
                results=[]
                for feature in data.get('features',[])[:5]:
                    p=feature.get('properties',{}); lon,lat=feature['geometry']['coordinates'][:2]
                    if not -180<=lon<=180 or not -90<=lat<=90: continue
                    label=', '.join(dict.fromkeys(str(p[k]) for k in ['name','street','city','state','country'] if p.get(k)))[:500]
                    results.append({'lat':lat,'lon':lon,'label':label or query})
                path.write_text(json.dumps(results))
                return results
            except GeocodeError: raise
            except Exception as error: raise GeocodeError('No se pudo completar la búsqueda. Puedes usar coordenadas manuales.') from error

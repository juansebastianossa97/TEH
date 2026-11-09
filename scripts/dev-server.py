"""Local development only. /dev is not packaged in dist or deployed to Vercel.
The map lab proxy only fetches HTTPS tiles.openfreemap.org; never arbitrary URLs.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from geocoder import Geocoder, GeocodeError
from urllib.parse import urlparse, parse_qs, unquote
import argparse, json, time, threading, hashlib, tempfile, subprocess, re
ROOT=Path(__file__).resolve().parents[1]
CACHE=Path(tempfile.gettempdir())/'jsop-openfreemap-lab';CACHE.mkdir(exist_ok=True)
locks={};stats={};guard=threading.Lock()
geocoder=Geocoder()
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        path=unquote(urlparse(path).path)
        base=ROOT/'development' if path.startswith('/dev/') else ROOT/'dist'
        relative=path[5:] if path.startswith('/dev/') else path.lstrip('/')
        target=(base/relative).resolve()
        return str(target if target.is_relative_to(base) else base/'__forbidden__')
    def do_GET(self):
        u=urlparse(self.path)
        if u.path in ('/', '/index.html', '/dev/mapa'):
            html=(ROOT/'dist/index.html').read_text()
            html=re.sub(r'(src|href)="(?!https?:|/|#|data:)([^"]+)"', r'\1="/\2"', html)
            html=html.replace('src="/app.js', 'src="/dev/map-app.js')
            html=html.replace('</head>','<link rel="stylesheet" href="/dev/cloud/community.css"></head>')
            html=html.replace('</header>', '<nav class="map-actions" aria-label="Navegación principal"><a class="collaborator-link" href="/dev/community.html?modo=registro">Ser colaborador</a></nav></header>', 1)
            data=html.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(data);return
        if u.path=='/dev/map-app.js':
            script=(ROOT/'dist/app.js').read_text().replace("'./map-loading.js?v=1'", "'/map-loading.js?v=1'")
            script=re.sub(r'(?<![/\w])assets/', '/assets/', script).replace('href="santa-sofia.html', 'href="/santa-sofia.html')
            script+='\nimport {mountPublications} from "/dev/build/cloud/markers.js";\nmountPublications(()=>map);\n'
            self.send_response(200);self.send_header('Content-Type','text/javascript; charset=utf-8');self.end_headers();self.wfile.write(script.encode());return
        if u.path=='/dev/geocode':
            try:
                result=geocoder.search(parse_qs(u.query).get('q',[''])[0]);status=200
            except GeocodeError as error:
                result={'error':str(error)};status=error.status
            data=json.dumps(result).encode()
            self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data);return
        if u.path=='/dev/network-stats':
            trial=parse_qs(u.query).get('trial',[''])[0]
            with guard: data=json.dumps(stats.get(trial,{'requests':0,'bytes':0,'aborted':0,'errors':0})).encode()
            self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data);return
        if u.path=='/dev/network':return self.proxy(parse_qs(u.query))
        return super().do_GET()
    def proxy(self,q):
        url=q.get('url',[''])[0];parsed=urlparse(url)
        if parsed.scheme!='https' or parsed.netloc!='tiles.openfreemap.org':return self.send_error(403)
        key=hashlib.sha256(url.encode()).hexdigest();file=CACHE/key
        trial=q.get('trial',[''])[0]
        with guard:
            lock=locks.setdefault(key,threading.Lock())
            record=stats.setdefault(trial,{'requests':0,'bytes':0,'aborted':0,'errors':0});record['requests']+=1
        try:
            with lock:
                if file.exists():data=file.read_bytes()
                else:
                    data=subprocess.run(['curl','--fail','--silent','--show-error','--max-time','30','--proto','=https',url],capture_output=True,check=True).stdout
                    file.write_bytes(data)
            delay=min(3000,max(0,int(q.get('delay',['800'])[0])))/1000
            rate=min(4096,max(32,int(q.get('kbps',['128'])[0])))*1024
            time.sleep(delay)
            self.send_response(200);self.send_header('Content-Length',str(len(data)))
            self.send_header('Content-Type','application/octet-stream')
            self.send_header('Cache-Control','public, max-age=3600');self.end_headers()
            for i in range(0,len(data),16384):
                chunk=data[i:i+16384];self.wfile.write(chunk);self.wfile.flush()
                with guard: record['bytes']+=len(chunk)
                time.sleep(len(chunk)/rate)
        except (BrokenPipeError,ConnectionResetError):
            with guard: record['aborted']+=1
        except Exception as error:
            with guard: record['errors']+=1
            self.send_error(502,str(error))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4176);args=parser.parse_args()
    print(f'Mapa JSOP: http://127.0.0.1:{args.port}/index.html\nEditor: http://127.0.0.1:{args.port}/dev/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()

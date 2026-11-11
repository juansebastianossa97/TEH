"""Vercel HTTP adapter for the shared geocoder."""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json
from scripts.geocoder import Geocoder, GeocodeError

def transport(url):
    request = Request(url, headers={"User-Agent": "JSOP/1.0 (https://teoriahistoria.vercel.app)"})
    try:
        with urlopen(request, timeout=15) as response:
            return response.status, response.read()
    except HTTPError as error:
        return error.code, error.read()

geocoder = Geocoder(transport=transport)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            result = geocoder.search(parse_qs(urlparse(self.path).query).get("q", [""])[0])
            status = 200
        except GeocodeError as error:
            result, status = {"error": str(error)}, error.status
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "public, s-maxage=86400" if status == 200 else "no-store")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

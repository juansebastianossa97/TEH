"""Verify the generated static site, without a development server."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import re

root = Path(__file__).resolve().parents[1]
site = root / 'site'
class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag in ('script', 'img', 'link'):
            value = attrs.get('src') or attrs.get('href')
            if value:
                self.paths.append(value)

for page in ['index.html','editor/index.html','comunidad/index.html','revision/index.html','exposicion/index.html']:
    parser = Assets()
    parser.feed((site / page).read_text())
    for url in parser.paths:
        parsed = urlparse(url)
        if parsed.scheme or parsed.netloc:
            continue
        target = site / parsed.path.lstrip('/') if parsed.path.startswith('/') else site / Path(page).parent / parsed.path
        assert target.is_file(), (page, url)
for file in (site / 'app').rglob('*.js'):
    text = file.read_text()
    assert '/dev/' not in text, file
    assert not re.search(r'sb_secret_[A-Za-z0-9_-]{20,}', text), file
    for imported in re.findall(r'(?:from|import)\s*["\'](\.[^"\']+)["\']', text):
        assert (file.parent / imported).is_file(), (file, imported)
for file in (root / 'dist').rglob('*'):
    if file.is_file() and file.name not in ('index.html', 'app.js'):
        assert file.read_bytes() == (site / file.relative_to(root / 'dist')).read_bytes(), file
assert '/app/cloud/markers.js' in (site/'app.js').read_text()
assert '/comunidad/?modo=registro' in (site/'index.html').read_text()
print('OK: cinco páginas, recursos, chunks, rutas públicas y archivos originales.')

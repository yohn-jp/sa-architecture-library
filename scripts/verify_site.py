"""Verify the generated reading site before publishing; standard library only."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import hashlib
import re

ROOT = Path('dist')
BASE = '/sa-architecture-library/'
ORIGIN = 'https://yohn-jp.github.io'
ORIGINAL_SHA256 = 'bffcc3548d670c1078ec7bb8a548eff2e48323211eb83c431d206b15223e2e01'

class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.ids, self.links = set(), []
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if attrs.get(key):
                self.links.append(attrs[key])

original = ROOT / 'complete/index.html'
assert original.exists(), 'Complete textbook is missing'
assert hashlib.sha256(original.read_bytes()).hexdigest() == ORIGINAL_SHA256, 'Original textbook changed'

chapters = []
for source in sorted(Path('src/content/books').glob('*/*.md')):
    text = source.read_text(encoding='utf-8')
    if re.search(r'^draft:\s*true\s*$', text, re.M):
        continue
    volume = re.search(r'^volume:\s*(\S+)\s*$', text, re.M)
    order = re.search(r'^order:\s*(\d+)\s*$', text, re.M)
    assert volume and order, f'Missing metadata: {source}'
    route = f"books/{volume[1]}/{int(order[1]):02d}/"
    page = ROOT / route / 'index.html'
    assert page.exists(), f'Published chapter has no reading page: {route}'
    rendered = page.read_text(encoding='utf-8')
    assert 'class="reading-body"' in rendered, f'Reader missing: {route}'
    assert '出典と照合範囲' in rendered, f'Source notes missing: {route}'
    assert 'id="source-1"' in rendered, f'Source anchor missing: {route}'
    assert BASE + 'complete/#ch-' in rendered, f'Textbook cross-reference missing: {route}'
    assert BASE + 'syllabus/#item-' in rendered, f'Syllabus cross-reference missing: {route}'
    chapters.append(route)
assert chapters, 'No published supplementary chapter'
assert len(chapters) == len(set(chapters)), 'Duplicate chapter URL'

cache = {}
for page in ROOT.rglob('*.html'):
    relative = page.relative_to(ROOT).as_posix()
    if relative.startswith(('complete/', 'pagefind/')):
        continue
    doc = Document(page)
    url = ORIGIN + BASE + relative.removesuffix('index.html')
    for link in doc.links:
        target = urlsplit(urljoin(url, link))
        if target.netloc != 'yohn-jp.github.io' or target.scheme not in ('http', 'https'):
            continue
        assert target.path.startswith(BASE), f'Broken project base in {relative}: {link}'
        path = ROOT / unquote(target.path[len(BASE):])
        if target.path.endswith('/') or path.is_dir():
            path /= 'index.html'
        assert path.is_file(), f'Missing internal target in {relative}: {link}'
        if target.fragment and path.suffix == '.html':
            if path not in cache:
                cache[path] = Document(path)
            assert unquote(target.fragment) in cache[path].ids, f'Missing anchor in {relative}: {link}'

assert (ROOT / 'pagefind/pagefind.js').is_file(), 'Search bundle missing'
print(f'PASS: {len(chapters)} chapters; internal links, assets, anchors, cross-references and original SHA-256 verified')

"""Check the actual public Pages response after deployment, not only the build."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlsplit
from html import unescape
import hashlib
import os
import re
import sys
import time

base = sys.argv[1].rstrip('/') + '/'
assert base == 'https://architect.library.yohn.jp/', f'Unexpected publication target: {base}'
revision = os.environ.get('GITHUB_SHA', '')

def fetch(path, check):
    url = base + path + '?revision=' + revision
    for attempt in range(8):
        try:
            request = Request(url, headers={'User-Agent': 'SA-Library-Publication-Check', 'Cache-Control': 'no-cache'})
            with urlopen(request, timeout=20) as response:
                data = response.read()
                assert response.status == 200, f'HTTP {response.status}'
                assert urlsplit(response.url).netloc == 'architect.library.yohn.jp'
            check(data)
            print('PASS public HTTP:', base + path)
            return
        except Exception as error:
            if attempt == 7:
                raise
            print(f'Waiting for published revision ({attempt + 1}/8): {path}: {error}')
            time.sleep(5)


def require_text(expected):
    def check(data):
        assert expected in unescape(data.decode('utf-8')), f'Missing expected content: {expected}'
    return check

fetch('styles.css', require_text('.site-header'))
fetch('books/', require_text('専門領域別の副読本'))
count = 0
for source in sorted(Path('src/content/books').glob('*/*.md')):
    content = source.read_text(encoding='utf-8')
    if re.search(r'^draft:\s*true\s*$', content, re.M):
        continue
    title = re.search(r'^title:\s*(.+)$', content, re.M)[1].strip()
    route = f'books/{source.parent.name}/{source.stem}/'
    fetch(route, require_text(title))
    count += 1

def original_unchanged(data):
    assert hashlib.sha256(data).hexdigest() == 'bffcc3548d670c1078ec7bb8a548eff2e48323211eb83c431d206b15223e2e01', 'Published original textbook differs'

fetch('practice/', require_text('年度別模擬試験'))
fetch('practice/year/', require_text('試験を開始'))
fetch('practice/year/exam/', require_text('採点して試験を終了'))
fetch('practice/year/result/', require_text('採点結果'))
fetch('practice/random/', require_text('全年度ランダム演習'))
fetch('practice/review/', require_text('間違えた問題の復習'))
fetch('practice/questions/2025r07h/q01.webp', lambda data: (
    data.startswith(b'RIFF') and b'WEBP' in data[:16] and len(data) > 1000
    or (_ for _ in ()).throw(AssertionError('Question image missing or invalid'))
))
# PM1 PDFs are committed artifacts. Verify that all nine files are served
# at the published origin, rather than trusting the build alone.
import json
pm1_sources = json.loads(Path('src/data/pm1-sources.json').read_text(encoding='utf-8'))
pm1_manifest = json.loads(Path('public/practice/pm1/pdfs/manifest.json').read_text(encoding='utf-8'))
assert len(pm1_sources) == 9 and set(pm1_manifest) == {year['id'] for year in pm1_sources}
fetch('practice/pm1/', require_text('2016年度'))
fetch('practice/pm1/exam/', require_text('公式問題冊子'))
fetch('practice/pm1/result/', require_text('演習答案の確認'))

def verify_pdf_head(year):
    url = base + 'practice/pm1/pdfs/' + year['id'] + '.pdf?revision=' + revision
    for attempt in range(8):
        try:
            request = Request(url, method='HEAD', headers={
                'User-Agent': 'SA-Library-Publication-Check', 'Cache-Control': 'no-cache'})
            with urlopen(request, timeout=20) as response:
                assert response.status == 200, f'HTTP {response.status}'
                assert urlsplit(response.url).netloc == 'architect.library.yohn.jp'
                length = response.headers.get('Content-Length')
                assert length is not None and int(length) == pm1_manifest[year['id']]['bytes'], 'PM1 PDF length mismatch'
                assert 'pdf' in response.headers.get('Content-Type','').lower(), 'PM1 content type mismatch'
            print('PASS public PM1 PDF:', year['id'])
            return
        except Exception as error:
            if attempt == 7:
                raise
            print(f'Waiting for PM1 PDF deployment ({attempt + 1}/8): {year["id"]}: {error}')
            time.sleep(5)

for pm1_year in pm1_sources:
    verify_pdf_head(pm1_year)

fetch('practice/pm1/result/', require_text('IPA公式解答例'))
fetch('complete/', original_unchanged)
print(f'PASS: {count} live chapters, stylesheet, catalogue and unchanged original textbook')

"""Verify the generated reading site before publishing; standard library only."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import hashlib
import re

ROOT = Path('dist')
BASE = '/'
ORIGIN = 'https://architect.library.yohn.jp'
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
        if target.netloc != 'architect.library.yohn.jp' or target.scheme not in ('http', 'https'):
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

# The practice page must contain the complete 225-question image set.
import json
practice = ROOT / 'practice/index.html'
assert practice.is_file(), 'Practice mode selection page is missing'
hub = practice.read_text(encoding='utf-8')
assert '年度別模擬試験' in hub and '全年度ランダム演習' in hub, 'Both practice modes must be visible'
annual_setup = ROOT / 'practice/year/index.html'
annual_exam = ROOT / 'practice/year/exam/index.html'
annual_result = ROOT / 'practice/year/result/index.html'
random = ROOT / 'practice/random/index.html'
review = ROOT / 'practice/review/index.html'
for page in [annual_setup, annual_exam, annual_result, random, review]:
    assert page.is_file(), f'Practice journey page is missing: {page}'
assert 'id="primary"' in annual_setup.read_text(encoding='utf-8'), 'Explicit annual start is missing'
assert 'id="question-image"' in annual_exam.read_text(encoding='utf-8'), 'Exam question renderer is missing'
assert 'id="review-list"' in annual_result.read_text(encoding='utf-8'), 'Result review list is missing'
assert 'id="mistake-list"' in review.read_text(encoding='utf-8'), 'Mistake notebook is missing'
question_index = Path('src/data/am2-question-index.ts').read_text(encoding='utf-8')
indexed = re.findall(r'^  "(20[0-9]{2}:[0-9]{1,2})": [{]', question_index, re.M)
assert len(indexed) == 225 and len(set(indexed)) == 225, 'All 225 questions need unique textbook study references'
# Every new explanation must match the published answer key.
explanations_source = Path('src/data/am2-explanations.ts').read_text(encoding='utf-8')
answers_source = Path('src/data/am2.ts').read_text(encoding='utf-8')
key_match = re.search(r"id:'2025r07h'.*?key:'([アイウエ]{25})'", answers_source)
assert key_match, '2025 answer key is missing'
for n, answer in enumerate(key_match[1][:10], start=1):
    entry = re.search(
        r"  '2025r07h:" + str(n) + r"': \\{\\s*text: (\"(?:[^\\\"\\\\]|\\\\.)*\")",
        explanations_source,
    )
    assert entry, f'2025 question {n} has no individual explanation'
    explanation = json.loads(entry[1])
    assert len(explanation) >= 120, f'2025 question {n}: explanation too short'
    assert explanation.startswith('正解：' + answer), f'2025 question {n}: explanation disagrees with answer key'

manifest_path = ROOT / 'practice/questions/manifest.json'
assert manifest_path.is_file(), 'Practice asset manifest is missing'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
assert len(manifest) == 9, f'Expected 9 exam years, got {len(manifest)}'
for year, info in manifest.items():
    assert len(info['questions']) == 25, f'{year}: incomplete question image index'
    for n in range(1, 26):
        crop = ROOT / 'practice/questions' / year / f'q{n:02}.webp'
        assert crop.is_file() and crop.stat().st_size > 1000, f'Missing or empty problem crop: {crop}'

assert (ROOT / 'pagefind/pagefind.js').is_file(), 'Search bundle missing'
print(f'PASS: {len(chapters)} chapters; internal links, assets, anchors, cross-references and original SHA-256 verified')

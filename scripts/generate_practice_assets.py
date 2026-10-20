#!/usr/bin/env python3
"""Generate faithful individual-question images from official IPA SA AM2 PDFs.

The nine question PDFs are scans without a text layer. Copying the relevant
pixels preserves Japanese text, diagrams, equations, tables and answer choices.
"""
import argparse
import hashlib
import io
import json
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

import fitz
import numpy as np
from PIL import Image

# SHA-256 digests verified against the nine question PDFs in the source archive.
YEARS = {
    '2016h28a': ('2016h28','b7395e54f06492e37082ec2030e75a00a687450883436d7e9086fb1a14fc5ec2'),
    '2017h29a': ('2017h29','0779256bc23a67eb7e7043d3aa594766016cdb71d211654c9b64d831bee2dc87'),
    '2018h30a': ('2018h30','95c5907e97f1771e23ba9646eabbd729da6304990b86e69638c5f3f3e7937b0a'),
    '2019r01a': ('2019r01','dd042435e302e815bb47ab24d791df121aa0200e18a2ffab90cb31cd4f9767c6'),
    '2021r03h': ('2021r03','5a4216226c2415dfec9fee1d37dce3ebfceeb6c77b2f3c29fee9448366dc737c'),
    '2022r04h': ('2022r04','eeaacd8d1eae20cc2ff80fd4bfd6fca0e48ecfd7598b4f9b14d3a297a6dd87bd'),
    '2023r05h': ('2023r05','7372e2c433fc2770ae5d64a83661a4f46f9fe7e6b04334a111836e8236f9420d'),
    '2024r06h': ('2024r06','b52b01e152453c59d0e8afafdc4d942dcd859b28ed93dd0cfb2c7f5dc3f54b7e'),
    '2025r07h': ('2025r07','6bdfc33d2a2f8312bbbe51f3ae7333bb5bcdecb34dc4746c23073e1aee91b130'),
}

class PDFLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a' and dict(attrs).get('href'):
            self.links.append(dict(attrs)['href'])

def fetch_pdf(year, listing, expected, destination):
    page_url = f'https://www.ipa.go.jp/shiken/mondai-kaiotu/{listing}.html'
    filename = f'{year}_sa_am2_qs.pdf'
    for attempt in range(3):
        try:
            with urlopen(Request(page_url, headers={'User-Agent':'SA-Architecture-Library/1.0'}),timeout=35) as response:
                html = response.read().decode('utf-8',errors='replace')
            parser = PDFLinks()
            parser.feed(html)
            urls = [urljoin(page_url, href) for href in parser.links
                    if urlparse(urljoin(page_url,href)).path.endswith('/'+filename)]
            if len(urls) != 1:
                raise ValueError(f'{page_url}: expected one link to {filename}; found {len(urls)}')
            if urlparse(urls[0]).hostname != 'www.ipa.go.jp' or not urls[0].startswith('https://'):
                raise ValueError('Unexpected PDF host')
            with urlopen(Request(urls[0],headers={'User-Agent':'SA-Architecture-Library/1.0'}),timeout=50) as response:
                binary = response.read()
            digest = hashlib.sha256(binary).hexdigest()
            if not binary.startswith(b'%PDF') or digest != expected:
                raise ValueError(f'{filename}: original PDF integrity mismatch: {digest}')
            destination.parent.mkdir(parents=True,exist_ok=True)
            destination.write_bytes(binary)
            return urls[0]
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2*(attempt+1))

def question_starts(image):
    """Locate question headers in the empty left gutter of 1432x2026 scans."""
    if image.size != (1432,2026):
        raise ValueError(f'Unexpected scan size {image.size}')
    pixels = np.asarray(image)
    darkness = (pixels[130:1870,125:207] < 175).sum(axis=1)
    yes = darkness >= 4
    padded = np.pad(yes,(3,3),constant_values=False)
    dilated = np.convolve(padded.astype(int),np.ones(6,dtype=int),'same') > 0
    closed = np.convolve(dilated.astype(int),np.ones(6,dtype=int),'same') == 6
    closed = closed[3:3+len(yes)]
    begins = np.flatnonzero(closed & ~np.r_[False,closed[:-1]])
    ends = np.flatnonzero(closed & ~np.r_[closed[1:],False])
    return [int(s+130) for s,e in zip(begins,ends)
            if 17 <= e-s <= 35 and darkness[s:e+1].sum() >= 165]

def generate_crops(source,year,output):
    doc = fitz.open(source)
    if len(doc) != 16:
        raise ValueError(f'{year}: expected 16 pages, got {len(doc)}')
    pages = {}
    starts = []
    # Two initial title/instruction pages. Page 16 is not a question page.
    for i in range(2,15):
        images = doc[i].get_images()
        if len(images) != 1:
            raise ValueError(f'{year} page {i+1}: expected one image')
        image = Image.open(io.BytesIO(doc.extract_image(images[0][0])['image'])).convert('L')
        pages[i] = image
        for y in question_starts(image):
            starts.append((i,y))
    if len(starts) != 25:
        raise ValueError(f'{year}: detected {len(starts)} questions instead of 25: {starts}')
    folder = output / year
    folder.mkdir(parents=True,exist_ok=True)
    crops = []
    for index,(page,y) in enumerate(starts,1):
        image = pages[page]
        next_y = starts[index][1] if index < 25 and starts[index][0] == page else 1840
        top = max(140,y-28)
        if next_y <= top + 65:
            raise ValueError(f'{year} question {index}: invalid split')
        pixels = np.asarray(image)
        ink = (pixels[top:min(next_y-16,1840),142:1295] < 210).sum(axis=1)
        used = np.flatnonzero(ink >= 5)
        bottom = min(next_y-14,top+int(used[-1])+22 if len(used) else next_y-14)
        if bottom-top < 65:
            raise ValueError(f'{year} question {index}: suspiciously short')
        image.crop((110,top,1320,bottom)).save(folder/f'q{index:02d}.webp',format='WEBP',quality=88,method=0)
        crops.append({'question':index,'page':page+1,'top':top,'bottom':bottom})
    return crops

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir',type=Path,default=Path('.cache/ipa-am2'))
    parser.add_argument('--output-dir',type=Path,default=Path('public/practice/questions'))
    parser.add_argument('--offline',action='store_true')
    args = parser.parse_args()
    manifest = {}
    for year,(listing,expected) in YEARS.items():
        source = args.source_dir / f'{year}_sa_am2_qs.pdf'
        if source.exists() and hashlib.sha256(source.read_bytes()).hexdigest() != expected:
            source.unlink()
        if not source.exists():
            if args.offline:
                raise RuntimeError(f'{source}: official PDF unavailable in offline mode')
            pdf_url = fetch_pdf(year,listing,expected,source)
        else:
            pdf_url = f'https://www.ipa.go.jp/shiken/mondai-kaiotu/{listing}.html'
        questions = generate_crops(source,year,args.output_dir)
        manifest[year] = {'source':pdf_url,'sha256':expected,'questions':questions}
        print(year,len(questions),'questions generated',flush=True)
    (args.output_dir/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    assert sum(len(x['questions']) for x in manifest.values()) == 225
    print('PASS: 225 faithful exam questions generated',flush=True)

if __name__ == '__main__':
    main()

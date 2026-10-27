#!/usr/bin/env python3
"""One-time, evidence-preserving ingestion of IPA SA PM1 answer PDFs and question OCR."""
import hashlib
import json
import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import fitz

ROOT = Path(__file__).resolve().parent.parent
SOURCES = json.loads((ROOT / 'src/data/pm1-sources.json').read_text(encoding='utf-8'))
PDFS = ROOT / 'public/practice/pm1/pdfs'
ANSWERS = ROOT / 'public/practice/pm1/answers'
AUDIT = ROOT / 'src/data/pm1-audit'
BRANCH = 'feat/pm1-official-structured-answers'

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            href = dict(attrs).get('href')
            if href: self.links.append(href)

def official_get(url, size=12_000_000):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname != 'www.ipa.go.jp':
        raise ValueError('Non-IPA host: '+url)
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent': 'SA-Architecture-Library/1.0'}), timeout=45) as response:
                redirected = urlparse(response.geturl())
                if redirected.hostname != 'www.ipa.go.jp' or redirected.scheme != 'https':
                    raise ValueError('Redirected away from IPA')
                data = response.read(size+1)
            if not data or len(data) > size: raise ValueError('Bad payload size')
            return data
        except Exception:
            if attempt == 2: raise
            time.sleep(attempt+2)

def answer_url(source):
    html = official_get(source['sourcePage'], 7_000_000).decode('utf-8','replace')
    links = Links();links.feed(html)
    expected = source['id']+'_sa_pm1_ans.pdf'
    found = sorted({urljoin(source['sourcePage'], href) for href in links.links if urlparse(urljoin(source['sourcePage'],href)).path.endswith('/'+expected)})
    if len(found) != 1: raise ValueError(f"Expected unique official answer link {expected}: {found}")
    return found[0]

def get_ocr(pdf_bytes):
    document = fitz.open(stream=pdf_bytes,filetype='pdf')
    def page_ocr(page_no):
        page = document[page_no]
        extracted = page.get_text('text',sort=True).strip()
        if len(extracted) > 350:
            return {'page':page_no+1, 'method':'embedded', 'text':extracted}
        pix = page.get_pixmap(matrix=fitz.Matrix(1.7,1.7),alpha=False,colorspace=fitz.csGRAY)
        env = dict(os.environ);env['OMP_THREAD_LIMIT']='1'
        done = subprocess.run(['tesseract','stdin','stdout','-l','jpn','--psm','6'],input=pix.tobytes('png'),stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,timeout=70)
        if done.returncode: raise RuntimeError(f"Page {page_no+1} OCR failed: {done.stderr.decode('utf8','replace')[:350]}")
        return {'page':page_no+1,'method':'jpn-ocr','text':done.stdout.decode('utf8','replace').strip()}
    try:
        with ThreadPoolExecutor(max_workers=4) as pool:
            work=[pool.submit(page_ocr,i) for i in range(len(document))]
            return sorted((f.result() for f in as_completed(work)),key=lambda p:p['page'])
    finally:document.close()

def get_answer(pdf_bytes):
    document=fitz.open(stream=pdf_bytes,filetype='pdf')
    if len(document)>8 or document.is_encrypted:raise ValueError('Invalid official answer PDF structure')
    result=[]
    for pi,page in enumerate(document):
        text=page.get_text('text',sort=True)
        lines=[]
        for block in page.get_text('dict')['blocks']:
            if block['type']!=0:continue
            for line in block['lines']:
                s=''.join(span['text'] for span in line['spans']).strip()
                if s:lines.append({'text':s,'x':round(line['bbox'][0],1),'y':round(line['bbox'][1],1),'x1':round(line['bbox'][2],1)})
        result.append({'page':pi+1,'text':text,'lines':sorted(lines,key=lambda a:(round(a['y']/3)*3,a['x']))})
    document.close()
    return result

def write_json(path, data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def commit_year(year):
    subprocess.run(['git','add','src/data/pm1-audit/'+year+'.json','public/practice/pm1/answers/'+year+'.pdf'],check=True,cwd=ROOT)
    subprocess.run(['git','commit','-m','data: import official SA PM1 '+year+' answer and question OCR evidence'],check=True,cwd=ROOT)
    subprocess.run(['git','push','origin','HEAD:'+BRANCH],check=True,cwd=ROOT)

def main():
    ANSWERS.mkdir(parents=True,exist_ok=True)
    AUDIT.mkdir(parents=True,exist_ok=True)
    for source in SOURCES:
        year=source['id']
        outfile=AUDIT/(year+'.json')
        if outfile.is_file():
            print('SKIP',year,flush=True);continue
        url=answer_url(source)
        answer=official_get(url)
        if not (answer.startswith(b'%PDF-') and b'%%EOF' in answer[-2048:]):raise ValueError('Corrupt answer '+year)
        dest=ANSWERS/(year+'.pdf')
        dest.write_bytes(answer)
        question_data=(PDFS/(year+'.pdf')).read_bytes()
        extracted=get_answer(answer)
        ocr=get_ocr(question_data)
        write_json(outfile,{'yearId':year,'officialAnswerUrl':url,'answerSha256':hashlib.sha256(answer).hexdigest(),
            'questionSha256':hashlib.sha256(question_data).hexdigest(),'answerPages':extracted,'questionPages':ocr})
        print('EXTRACTED',year,'answer pages',len(extracted),'question pages',len(ocr),flush=True)
        commit_year(year)
    print('PASS: IPA official answer PDFs and original question OCR evidence for 9 sessions',flush=True)

if __name__=='__main__':main()

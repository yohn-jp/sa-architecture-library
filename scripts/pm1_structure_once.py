#!/usr/bin/env python3
"""Build IPA PM1 answer fields from the original PDF's native table cells.

This deterministic importer keeps source page/table/row provenance. Never
invent missing answers or length limits. Limit reconciliation is a separate,
explicitly verified operation against the scanned question booklet.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
SOURCES=json.loads((ROOT/'src/data/pm1-sources.json').read_text())
OUT=ROOT/'src/data/pm1-structured'
OUT.mkdir(parents=True,exist_ok=True)
BRANCH='feat/pm1-official-structured-answers'
FULLWIDTH=str.maketrans('１２３４５６７８９０','1234567890')
SUB=re.compile(r'^\(\s*([0-9０-９]{1,2})\s*\)$')
SECT=re.compile(r'^設問\s*([0-9０-９]+)(.*)$')
QUESTION=re.compile(r'^問\s*([0-9０-９]+)$')
CIRCLED=re.compile(r'[①②③④⑤⑥⑦⑧⑨⑩]')
SINGLE=re.compile(r'^[a-zA-Zａ-ｚＡ-Ｚ]$')
NOTES={'','備考','順不同'}

def compact(value):
    if value is None:return ''
    value=str(value).replace('\u200b','').strip()
    # PDF wraps contiguous sentences visually. A new bullet retains its delimiter.
    value=re.sub(r'\n(?=[^・●\-])','',value)
    return value.strip()

def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))

def headings(audit):
    found=[]
    for page in audit['answerPages']:
        for line in page['lines']:
            match=QUESTION.match(line['text'].strip().translate(FULLWIDTH))
            if match and line['x']<85:
                found.append((page['page'],line['y'],int(match.group(1))))
    return found

def locate_question(headings,page,y):
    preceding=[(p,v,n) for p,v,n in headings if (p,v)<=(page,y)]
    if not preceding: raise ValueError(f'No question heading at page {page}, y={y}')
    return preceding[-1][2]

def parse_table(year,question,page_no,table_no,table):
    rows=table['rows']
    assert any('解答例' in str(cell) for cell in rows[0] if cell)
    out=[]
    section=None
    subsection=None
    circled=None
    last_label=None
    for i,row in enumerate(rows[1:],start=1):
        values=[compact(v) for v in row]
        if not any(values):continue
        first=values[0]
        sec=SECT.match(first.translate(FULLWIDTH))
        if sec:
            section=int(sec.group(1))
            subsection=None
            circled=None
        if section is None:
            raise ValueError(f'Unlabeled official answer row: {year} Q{question} p{page_no} t{table_no} row{i}')
        if len(values)>1:
            second=values[1]
            match=SUB.match(second.translate(FULLWIDTH))
            if match:
                subsection=int(match.group(1))
                circled=None
        # The remarks column is NEVER part of the official answer.
        body=[(ci,value) for ci,value in enumerate(values[1:-1],start=1) if value]
        if body and SUB.match(body[0][1].translate(FULLWIDTH)): body=body[1:]
        if not body:raise ValueError(f'Empty answer row: {year} Q{question} p{page_no} {row}')
        answer=body[-1][1]
        labels=[v for _,v in body[:-1] if v]
        # Some one-cell answers are prefixed inline: 設問1(1) 本文.
        inline=SECT.match(answer.translate(FULLWIDTH))
        if inline and sec:
            after=inline.group(2).strip()
            match=re.match(r'^\(\s*(\d+)\s*\)\s*(.*)',after)
            if match:
                subsection=int(match.group(1))
                answer=match.group(2)
            elif after: answer=after
        if answer.startswith('(') and not labels:
            match=re.match(r'^\(\s*(\d+)\s*\)\s*(.+)',answer)
            if match:
                subsection=int(match.group(1))
                answer=match.group(2)
        if CIRCLED.fullmatch(labels[0]) if labels else False:
            circled=labels[0]
            labels=labels[1:]
        elif any(CIRCLED.search(label) for label in labels):
            pass
        label='設問'+str(section)
        if subsection is not None:label+='（'+str(subsection)+'）'
        if circled:label+=' '+circled
        if labels:label+='・'+'・'.join(labels)
        if not answer:
            raise ValueError(f'Missing answer text: {year} Q{question} {label}')
        # The original answer cell may combine several separately numbered answers.
        multi=next((label for label in labels if len(CIRCLED.findall(label))>1),None)
        if multi:
            parts=[compact(v) for v in re.split(r'\n(?=・)',body[-1][1]) if compact(v)]
            if len(parts)!=len(CIRCLED.findall(multi)):
                raise ValueError(f'Ambiguous combined answers: {year} Q{question} {label}: {answer}')
            for symbol,part in zip(CIRCLED.findall(multi),parts):
                out.append({'label':label.replace(multi,symbol),'answer':part,'limit':None,
                    'source':{'answerPage':page_no,'table':table_no,'row':i}})
        else:
            out.append({'label':label,'answer':answer,'limit':None,
                'source':{'answerPage':page_no,'table':table_no,'row':i}})
        last_label=label
    return out

def main():
    subprocess.run(['git','config','user.name','github-actions[bot]'],check=True,cwd=ROOT)
    subprocess.run(['git','config','user.email','41898282+github-actions[bot]@users.noreply.github.com'],check=True,cwd=ROOT)
    for year in SOURCES:
        year_id=year['id']
        audit=read_json(ROOT/'src/data/pm1-audit'/f'{year_id}.json')
        tables=read_json(ROOT/'src/data/pm1-tables'/f'{year_id}.json')
        heads=headings(audit)
        questions={str(i):[] for i in range(1,year['questionCount']+1)}
        count=0
        for page in tables['pages']:
            for ti,table in enumerate(page['tables']):
                if not table['rows'] or not any('解答例' in str(cell) for cell in table['rows'][0] if cell):
                    continue
                number=locate_question(heads,page['page'],table['bbox'][1])
                if str(number) not in questions:raise ValueError('Unknown question: '+year_id+' '+str(number))
                rows=parse_table(year_id,number,page['page'],ti,table)
                for row in rows:
                    row['id']='f'+str(len(questions[str(number)])+1).zfill(3)
                    questions[str(number)].append(row)
                count+=len(rows)
        if any(not answer for answer in questions.values()):
            raise ValueError(f'{year_id}: missing official question answer tables '+str({k:len(v) for k,v in questions.items()}))
        seen=[(q,f['id']) for q,fs in questions.items() for f in fs]
        if len(seen)!=len(set(seen)):raise ValueError('Duplicate fields')
        outfile=OUT/f'{year_id}.json'
        outfile.write_text(json.dumps({'yearId':year_id,'officialAnswerUrl':audit['officialAnswerUrl'],
            'answerSha256':audit['answerSha256'],'questionSha256':audit['questionSha256'],
            'questions':questions},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        subprocess.run(['git','add',str(outfile.relative_to(ROOT))],check=True,cwd=ROOT)
        subprocess.run(['git','commit','-m',f'data: map SA PM1 {year_id} official answers to question fields'],check=True,cwd=ROOT)
        subprocess.run(['git','push','origin','HEAD:'+BRANCH],check=True,cwd=ROOT)
        print('FIELDS',year_id,{k:len(v) for k,v in questions.items()},'total',count,flush=True)
    print('PASS: official answer tables mapped into all 9 year/question datasets')

if __name__=='__main__':main()

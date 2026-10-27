#!/usr/bin/env python3
"""Extract PDF-native cell grids for manual cross-verification of all IPA PM1 answers."""
import json
import subprocess
from pathlib import Path
import fitz

ROOT=Path(__file__).resolve().parent.parent
BRANCH='feat/pm1-official-structured-answers'
SOURCES=json.loads((ROOT/'src/data/pm1-sources.json').read_text())
OUT=ROOT/'src/data/pm1-tables'
OUT.mkdir(parents=True,exist_ok=True)
subprocess.run(['git','config','user.name','github-actions[bot]'],check=True,cwd=ROOT)
subprocess.run(['git','config','user.email','41898282+github-actions[bot]@users.noreply.github.com'],check=True,cwd=ROOT)
for row in SOURCES:
    year=row['id']
    doc=fitz.open(ROOT/'public/practice/pm1/answers'/f'{year}.pdf')
    pages=[]
    for page_no,page in enumerate(doc):
        tables=[]
        for strategy in ('lines_strict','lines'):
            matches=page.find_tables(strategy=strategy)
            for tab in matches.tables:
                rows=tab.extract()
                if len(rows)<2:continue
                tables.append({'strategy':strategy,
                    'bbox':[round(float(v),1) for v in tab.bbox],
                    'rows':rows})
            if tables:break
        pages.append({'page':page_no+1,'tables':tables})
    dest=OUT/f'{year}.json'
    dest.write_text(json.dumps({'yearId':year,'pages':pages},ensure_ascii=False,indent=2)+'\n')
    subprocess.run(['git','add',str(dest.relative_to(ROOT))],check=True,cwd=ROOT)
    subprocess.run(['git','commit','-m',f'data: extract verified IPA answer table cells {year}'],check=True,cwd=ROOT)
    subprocess.run(['git','push','origin','HEAD:'+BRANCH],check=True,cwd=ROOT)
    print(year,[(len(p['tables']),[len(t['rows']) for t in p['tables']]) for p in pages],flush=True)

// Source, type, browser and localStorage regression for all IPA SA PM1 years.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4185/';
const server = spawn('python3', ['-m', 'http.server', '4185', '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' });
let browser;
try {
  let running = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { running = (await fetch(base)).ok; } catch {}
    if (running) break;
    await delay(100);
  }
  assert(running, 'Preview server must start');
  const [sources, manifest, am2, fields, answers] = await Promise.all([
    readFile('src/data/pm1-sources.json','utf8').then(JSON.parse),
    readFile('dist/practice/pm1/pdfs/manifest.json','utf8').then(JSON.parse),
    readFile('src/data/am2.ts','utf8'),
    readFile('src/data/pm1-fields.json','utf8').then(JSON.parse),
    readFile('src/data/pm1-official-answers.json','utf8').then(JSON.parse)
  ]);
  const expected = [...am2.matchAll(/id:'(20\d{2}[rh]\d{2}[ah])'/g)].map(match => match[1]);
  assert.equal(expected.length, 9);
  assert.deepEqual(sources.map(y => y.id), expected);
  assert.deepEqual(Object.keys(manifest), expected);
  assert.deepEqual(Object.keys(fields), expected);
  assert.deepEqual(Object.keys(answers), expected);
  let fieldTotal = 0, limitedTotal = 0, questionTotal = 0;
  for (const source of sources) {
    const id = source.id;
    for (const [local, hash] of [
      ['dist/practice/pm1/pdfs/'+id+'.pdf',manifest[id].sha256],
      ['dist/practice/pm1/answers/'+id+'.pdf',answers[id].sha256]
    ]) {
      const bytes = await readFile(local);
      assert(bytes.subarray(0,5).equals(Buffer.from('%PDF-')), id+': invalid PDF header');
      assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,id+': unexpected original PDF');
      const rel = local.slice('dist/'.length);
      const response = await fetch(base+rel);
      assert.equal(response.status,200,id+': PDF not served from local origin');
      assert((response.headers.get('content-type')??'').includes('application/pdf'),id+': invalid content type');
    }
    assert.equal(Object.keys(fields[id]).length,source.questionCount,id+': question count mismatch');
    assert.equal(Object.keys(answers[id].questions).length,source.questionCount,id+': answer question count mismatch');
    for (let question=1;question<=source.questionCount;question++) {
      const key=String(question);
      const original=fields[id][key], examples=answers[id].questions[key];
      assert(original.length>0 && original.length<=60,id+': missing or excessive official fields');
      assert.equal(original.length,examples.length,id+': field/answer length mismatch');
      assert.deepEqual(original.map(row=>row.id),examples.map(row=>row.id),id+': field ID mismatch');
      assert.deepEqual(original.map(row=>row.label),examples.map(row=>row.label),id+': official label mismatch');
      for (const [i,row] of original.entries()) {
        assert(/^f\d{3}$/.test(row.id));
        assert(row.limit===null || (Number.isInteger(row.limit)&&row.limit>=1&&row.limit<=10000));
        assert(examples[i].text.trim().length>0,id+'/'+question+'/'+row.id+': missing IPA example');
        assert(examples[i].source.answerPage>=1&&examples[i].source.answerPage<=10);
        if(row.limit!==null)limitedTotal++;
        fieldTotal++;
      }
      questionTotal++;
    }
  }
  assert.equal(questionTotal,34,'Every large problem must be covered');
  assert.equal(fieldTotal,322,'Every original official answer field must be covered');
  assert.equal(limitedTotal,230,'Character limits must match validated catalog');

  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1366,height:860}});
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto(base+'practice/');
  assert(await page.locator('a[href="/practice/pm1/"]').count(),'PM1 entry link is missing');
  await page.goto(base+'practice/pm1/');
  assert.deepEqual(await page.locator('#year option').evaluateAll(items=>items.map(item=>item.value)),expected);
  for(const year of sources) {
    await page.locator('#year').selectOption(year.id);
    assert.equal(await page.locator('#choices input[type="checkbox"]').count(),year.questionCount);
    assert.equal(await page.locator('#choices input:checked').count(),2);
    assert((await page.locator('#local-pdf').getAttribute('href')).endsWith('/'+year.id+'.pdf'));
  }

  // Test ALL nine years, all answer sections, and answer visibility only at completion.
  for(const year of sources) {
    await page.goto(base+'practice/pm1/?year='+year.id);
    await page.locator('#primary').click();
    await page.waitForURL('**/practice/pm1/exam/?year='+year.id);
    assert.equal(await page.locator('#question-tabs button').count(),2);
    const first = fields[year.id]['1'];
    const second = fields[year.id]['2'];
    assert.equal(await page.locator('#answer-fields textarea').count(),first.length,year.id+': missing auto-generated first-question inputs');
    assert.equal(await page.locator('.pm1-name-input[readonly]').count(),first.length);
    assert.equal(await page.locator('.pm1-limit-wrap input[readonly]').count(),first.length);
    assert((await page.locator('#pm1-pdf').getAttribute('src')).includes('/'+year.id+'.pdf'));
    assert.equal(await page.locator('.pm1-name-input').first().inputValue(),first[0].label);
    const text='演習テスト '+year.id;
    await page.locator('.pm1-textarea').first().fill(text);
    await page.locator('#question-tabs button').nth(1).click();
    assert.equal(await page.locator('#answer-fields textarea').count(),second.length,year.id+': missing second-question inputs');
    await page.reload();
    assert.equal(await page.locator('#question-tabs button.is-active').innerText(),'問2');
    await page.locator('#question-tabs button').first().click();
    assert.equal(await page.locator('.pm1-textarea').first().inputValue(),text,'Auto-saved text lost for '+year.id);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#finish').click();
    await page.waitForURL('**/practice/pm1/result/?year='+year.id);
    assert.equal(await page.locator('.pm1-result-section').count(),2);
    assert.equal(await page.locator('.pm1-official-response').count(),first.length+second.length);
    assert((await page.locator('#result-questions').innerText()).includes(text));
    assert((await page.locator('.pm1-official-response .pm1-result-text').first().innerText()).includes(answers[year.id].questions['1'][0].text));
    assert.equal(await page.locator('#score,[data-grade]').count(),0,'No scoring engine may appear');
  }

  // Long answers warn when exceeding the prescribed IPA limit, without truncating text.
  await page.goto(base+'practice/pm1/?year=2025r07h');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#new-attempt').click();
  await page.waitForURL('**/practice/pm1/exam/?year=2025r07h');
  const index=fields['2025r07h']['1'].findIndex(row=>row.limit===25);
  assert(index>=0);
  const written='文字数上限を超えることを検証するために入力した長めの日本語文章です。';
  await page.locator('.pm1-textarea').nth(index).fill(written);
  assert(await page.locator('.pm1-counter').nth(index).evaluate(el=>el.classList.contains('is-over')));
  assert.equal(await page.locator('.pm1-textarea').nth(index).inputValue(),written);
  await page.locator('#add-answer').click();
  assert.equal(await page.locator('#answer-fields textarea').count(),fields['2025r07h']['1'].length+1);
  await page.locator('.pm1-name-input').last().fill('追加メモ');
  await page.locator('.pm1-name-input').last().press('Tab');
  await page.locator('.pm1-textarea').last().fill('メモ内容');
  await page.reload();
  assert.equal(await page.locator('.pm1-textarea').last().inputValue(),'メモ内容');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#finish').click();
  await page.waitForURL('**/practice/pm1/result/?year=2025r07h');
  assert((await page.locator('#result-questions').innerText()).includes('メモ内容'));

  // Existing legacy v1 sessions must be upgraded without losing any answers or elapsed time.
  await page.goto(base+'practice/pm1/?year=2024r06h');
  await page.evaluate(()=>{
    localStorage.setItem('sa-pm1-session-v1:2024r06h',JSON.stringify({
      version:1,yearId:'2024r06h',selected:[1,2],startedAt:Date.now()-60_000,
      finishedAt:null,activeQuestion:1,answers:{
        '1':[{id:'a1',label:'旧設問1',text:'旧形式の記述回答',limit:18}],
        '2':[{id:'a1',label:'旧設問1',text:'旧設問2の記述',limit:null}]
      }
    }));
  });
  await page.goto(base+'practice/pm1/exam/?year=2024r06h');
  assert.equal(await page.locator('#answer-fields textarea').count(),fields['2024r06h']['1'].length+1);
  assert.equal(await page.locator('.pm1-textarea').last().inputValue(),'旧形式の記述回答');
  assert((await page.locator('#timer').innerText())!=='90:00','Legacy clock must continue');

  // A timed-out attempt is read-only, preserving old typed text.
  await page.goto(base+'practice/pm1/');
  await page.evaluate(()=>{
    localStorage.setItem('sa-pm1-session-v1:2022r04h',JSON.stringify({
      version:1,yearId:'2022r04h',selected:[1,3],
      startedAt:Date.now()-91*60_000,finishedAt:null,activeQuestion:1,
      answers:{
        '1':[{id:'a1',label:'旧設問1',text:'時間内の回答',limit:30}],
        '3':[{id:'a1',label:'旧設問1',text:'',limit:null}]
      }
    }));
  });
  await page.goto(base+'practice/pm1/exam/?year=2022r04h');
  await page.waitForURL('**/practice/pm1/result/?year=2022r04h');
  assert((await page.locator('#result-questions').innerText()).includes('時間内の回答'));
  assert.equal(await page.locator('.pm1-official-response').count(),fields['2022r04h']['1'].length+fields['2022r04h']['3'].length+1);

  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(base+'practice/pm1/');
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await mobile.close();
  assert.deepEqual(errors,[]);
  console.log('PASS: 9 years / 34 questions / 322 official answer fields / 230 numeric limits / legacy preservation / source-hash / browser comparison');
} finally {
  await browser?.close();
  server.kill();
}

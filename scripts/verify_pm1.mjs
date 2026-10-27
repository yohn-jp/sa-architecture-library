// Browser-level proof for afternoon-I CBT writing and committed PDF assets.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const host = 'http://127.0.0.1:4185/';
const server = spawn('python3', ['-m','http.server','4185','--bind','127.0.0.1','--directory','dist'], { stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try { ready = (await fetch(host)).ok; } catch {}
    if (ready) break;
    await delay(100);
  }
  assert(ready, 'PM1 local preview server failed to start');
  const sources = JSON.parse(await readFile('src/data/pm1-sources.json', 'utf8'));
  const manifest = JSON.parse(await readFile('dist/practice/pm1/pdfs/manifest.json', 'utf8'));
  const am2 = await readFile('src/data/am2.ts', 'utf8');
  const expectedYears = [...am2.matchAll(/id:'(20\d{2}[rh]\d{2}[ah])'/g)].map(match => match[1]);
  assert.equal(sources.length, 9, 'Nine afternoon-I years must be committed');
  assert.deepEqual(sources.map(year => year.id), expectedYears, 'PM1 archive must match AM2 years');
  assert.deepEqual(Object.keys(manifest), expectedYears, 'Manifest must cover exactly the PM1 archive');
  for (const source of sources) {
    const bytes = await readFile('dist/practice/pm1/pdfs/' + source.id + '.pdf');
    assert(bytes.subarray(0, 5).equals(Buffer.from('%PDF-')), source.id + ' is not a PDF');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest[source.id].sha256);
    assert.equal(source.pages, manifest[source.id].pages);
    const response = await fetch(host + 'practice/pm1/pdfs/' + source.id + '.pdf');
    assert(response.ok && (response.headers.get('content-type') ?? '').includes('application/pdf'), 'PDF HTTP response invalid: ' + source.id);
  }

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 860 } });
  const errors = [];
  page.on('pageerror', exception => errors.push(exception.message));
  await page.goto(host + 'practice/');
  assert(await page.locator('a[href="/practice/pm1/"]').count(), 'PM1 link is missing from practice home');
  await page.goto(host + 'practice/pm1/');
  assert.deepEqual(await page.locator('#year option').evaluateAll(options => options.map(option => option.value)), sources.map(source => source.id));
  for (const source of sources) {
    await page.locator('#year').selectOption(source.id);
    assert.equal(await page.locator('#choices input[type=checkbox]').count(), source.questionCount, 'Question count mismatch for ' + source.id);
    assert.equal(await page.locator('#choices input:checked').count(), 2, 'Default selection must contain two questions');
    assert((await page.locator('#local-pdf').getAttribute('href')).endsWith('/practice/pm1/pdfs/' + source.id + '.pdf'));
    assert((await page.locator('#official-source').getAttribute('href')) === source.sourcePage);
  }
  await page.locator('#year').selectOption('2025r07h');
  assert.equal(await page.locator('#choices input[type=checkbox]').count(), 3);
  assert.equal(await page.locator('#choices input:checked').count(), 2);
  await page.locator('#year').selectOption('2023r05h');
  assert.equal(await page.locator('#choices input[type=checkbox]').count(), 4);
  await page.locator('#choices input[value="2"]').uncheck();
  await page.locator('#choices input[value="3"]').check();
  assert.equal(await page.locator('#choices input:checked').count(), 2);
  assert.equal(await page.locator('#choices input[value="4"]').isDisabled(), true);
  await page.locator('#primary').click();
  await page.waitForURL('**/practice/pm1/exam/?year=2023r05h');
  assert.equal(await page.locator('#question-tabs button').count(), 2);
  assert((await page.locator('#pm1-pdf').getAttribute('src')).includes('/practice/pm1/pdfs/2023r05h.pdf'));
  assert((await page.locator('#pdf-open').getAttribute('href')).endsWith('/practice/pm1/pdfs/2023r05h.pdf'));
  assert.equal(await page.locator('#answer-fields textarea').count(), 1);
  const initialClock = await page.locator('#timer').innerText();
  assert(/^\d{2}:\d{2}$/.test(initialClock), 'Countdown must be displayed');

  await page.locator('.pm1-name-input').fill('設問1（1）');
  await page.locator('.pm1-name-input').press('Tab');
  await page.locator('.pm1-limit-wrap input').fill('6');
  await page.locator('.pm1-limit-wrap input').press('Tab');
  await page.locator('.pm1-textarea').fill('七文字以上です');
  assert((await page.locator('.pm1-counter').innerText()).includes('/ 6字'));
  assert(await page.locator('.pm1-counter').evaluate(element => element.classList.contains('is-over')), 'Limit warning missing');
  await page.locator('#add-answer').click();
  assert.equal(await page.locator('#answer-fields textarea').count(), 2);
  await page.locator('.pm1-name-input').nth(1).fill('設問1（2）');
  await page.locator('.pm1-name-input').nth(1).press('Tab');
  await page.locator('.pm1-textarea').nth(1).fill('解答B');
  await page.locator('#question-tabs button').nth(1).click();
  await page.locator('.pm1-textarea').first().fill('問3の回答');
  await page.reload();
  assert.equal(await page.locator('#question-tabs button.is-active').innerText(), '問3', 'Active question was not restored');
  assert.equal(await page.locator('.pm1-textarea').first().inputValue(), '問3の回答', 'PM1 answer did not persist');
  await page.locator('#question-tabs button').first().click();
  assert.equal(await page.locator('.pm1-textarea').count(), 2);
  assert.equal(await page.locator('.pm1-textarea').first().inputValue(), '七文字以上です');
  assert.equal(await page.locator('.pm1-textarea').nth(1).inputValue(), '解答B');
  assert.equal(await page.locator('.pm1-name-input').first().inputValue(), '設問1（1）');
  assert.equal(await page.locator('.pm1-limit-wrap input').first().inputValue(), '6');

  page.once('dialog', dialog => dialog.accept());
  await page.locator('#finish').click();
  await page.waitForURL('**/practice/pm1/result/?year=2023r05h');
  assert.equal(await page.locator('.pm1-result-section').count(), 2);
  const result = await page.locator('#result-questions').innerText();
  assert(result.includes('問3の回答') && result.includes('七文字以上です') && result.includes('解答B'));
  assert.equal(await page.locator('#score, [data-grade]').count(), 0, 'Grading output was unexpectedly introduced');
  await page.reload();
  assert((await page.locator('#result-questions').innerText()).includes('問3の回答'), 'Completed answers were lost');
  await page.goto(host + 'practice/pm1/?year=2023r05h');
  assert((await page.locator('#primary').innerText()).includes('答案を確認'));

  // A 90-minute-old active session cannot be edited after loading.
  await page.evaluate(() => {
    const id = '2024r06h';
    const selected = [1, 3];
    localStorage.setItem('sa-pm1-session-v1:' + id, JSON.stringify({
      version: 1, yearId: id, selected,
      startedAt: Date.now() - 91 * 60 * 1000, finishedAt: null,
      activeQuestion: 1,
      answers: {
        '1': [{ id: 'a1', label: '設問1', text: '時間内の回答', limit: 30 }],
        '3': [{ id: 'a1', label: '設問1', text: '', limit: null }]
      }
    }));
  });
  await page.goto(host + 'practice/pm1/exam/?year=2024r06h');
  await page.waitForURL('**/practice/pm1/result/?year=2024r06h');
  assert((await page.locator('#result-questions').innerText()).includes('時間内の回答'));

  // Corrupt localStorage must not be interpreted as a valid in-progress session.
  await page.evaluate(() => localStorage.setItem('sa-pm1-session-v1:2025r07h','{"version":999}'));
  await page.goto(host + 'practice/pm1/?year=2025r07h');
  assert((await page.locator('#session-status').innerText()).includes('新しい演習'));

  // Older fall-season IDs must support the same CBT editing journey.
  await page.goto(host + 'practice/pm1/?year=2016h28a');
  assert.equal(await page.locator('#choices input[type=checkbox]').count(), 4);
  await page.locator('#primary').click();
  await page.waitForURL('**/practice/pm1/exam/?year=2016h28a');
  assert((await page.locator('#pm1-pdf').getAttribute('src')).includes('2016h28a.pdf'));
  await page.locator('.pm1-textarea').fill('2016年度・午後Ⅰの解答');
  await page.reload();
  assert.equal(await page.locator('.pm1-textarea').inputValue(), '2016年度・午後Ⅰの解答');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#finish').click();
  await page.waitForURL('**/practice/pm1/result/?year=2016h28a');
  assert((await page.locator('#result-questions').innerText()).includes('2016年度・午後Ⅰの解答'));

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mobile.on('pageerror', exception => errors.push(exception.message));
  await mobile.goto(host + 'practice/pm1/');
  assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'PM1 setup overflows mobile');
  await mobile.close();
  assert.deepEqual(errors, []);
  console.log('PASS: nine vendored PDFs, matching AM2 calendar, selector, CBT editor, char limits, autosave, tabs, completion, expiration, persistence, mobile');
} finally {
  await browser?.close();
  server.kill();
}

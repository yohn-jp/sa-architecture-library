// Focused browser regression for the two random-practice grading modes.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4174/';
const server = spawn('python3', ['-m', 'http.server', '4174', '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { ready = (await fetch(base)).ok; } catch {}
    if (ready) break;
    await delay(100);
  }
  assert(ready, 'Practice preview server did not start');
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + 'practice/');
  await page.evaluate(() => {
    localStorage.setItem('sa-am2-random-v1', JSON.stringify({
      order: Array.from({ length: 225 }, (_, i) => i), index: 0, results: {}
    }));
    localStorage.setItem('sa-am2-random-fast-v1', 'false');
    localStorage.removeItem('sa-am2-mistakes-v1');
  });
  await page.goto(base + 'practice/random/');
  const card = page.locator('#question-card');
  const progress = page.locator('#progress');
  const waitColor = rgb => page.waitForFunction(
    expected => getComputedStyle(document.getElementById('question-card')).backgroundColor === expected,
    rgb, { timeout: 650 }
  );

  // Normal mode: grading requires the button, and the explanation remains visible.
  assert.equal(await page.locator('#fast-mode').isChecked(), false);
  await page.locator('input[name="choice"][value="エ"]').check(); // 2025 q1 correct
  assert.equal(await page.locator('#feedback').innerText(), '', 'Normal mode graded before button');
  await page.locator('#check').click();
  assert((await page.locator('#feedback').innerText()).includes('正解'));
  await waitColor('rgb(237, 248, 240)');
  assert(await page.locator('#explanation').isVisible());
  await page.locator('#next').click();

  await page.locator('input[name="choice"][value="ア"]').check(); // 2025 q2 incorrect
  await page.locator('#check').click();
  assert((await page.locator('#feedback').innerText()).includes('不正解'));
  await waitColor('rgb(255, 240, 239)');
  await page.locator('#next').click();

  // Rapid mode persists across reload and grades on selection without explanation.
  await page.locator('.fast-toggle').click();
  assert(await page.locator('#fast-mode').isChecked());
  await page.reload();
  assert(await page.locator('#fast-mode').isChecked(), 'Fast mode preference lost');
  assert(await page.locator('#check').isHidden());
  await page.locator('input[name="choice"][value="イ"]').check(); // 2025 q3 correct
  assert((await page.locator('#feedback').innerText()).includes('正解'));
  await waitColor('rgb(237, 248, 240)');
  assert(await page.locator('#explanation').isHidden());
  await page.waitForFunction(() => document.getElementById('progress').textContent.includes('4 / 225'), null, { timeout: 4000 });

  await page.locator('input[name="choice"][value="ア"]').check(); // 2025 q4 incorrect
  assert((await page.locator('#feedback').innerText()).includes('不正解'));
  await waitColor('rgb(255, 240, 239)');
  await page.waitForFunction(() => document.getElementById('progress').textContent.includes('5 / 225'), null, { timeout: 4000 });

  // Toggling off during the feedback window cancels auto-advance.
  await page.locator('input[name="choice"][value="ア"]').check(); // 2025 q5 correct
  await page.evaluate(() => document.getElementById('fast-mode').click());
  assert.equal(await page.locator('#fast-mode').isChecked(), false);
  assert(await page.locator('#explanation').isVisible());
  assert(await page.locator('#next').isVisible());
  await delay(1050);
  assert((await progress.innerText()).includes('5 / 225'), 'Auto-advance was not cancelled');
  await page.locator('.fast-toggle').click();
  await page.waitForFunction(() => document.getElementById('progress').textContent.includes('6 / 225'), null, { timeout: 4000 });

  // Reset during a pending auto-advance must not move the new run forward.
  await page.locator('input[name="choice"][value="ア"]').check();
  page.once('dialog', dialog => dialog.accept());
  await page.evaluate(() => document.getElementById('restart').click());
  assert((await progress.innerText()).includes('1 / 225'));
  await delay(1050);
  assert((await progress.innerText()).includes('1 / 225'), 'Reset retained an old timer');
  assert(await page.locator('#fast-mode').isChecked(), 'Reset unexpectedly changed fast mode');
  // Wrong answers survive restart, have stable IDs and are reviewable later.
  await page.goto(base + 'practice/review/');
  assert((await page.locator('#total-count').innerText()) === '3', 'Wrong answers must be recorded without duplicates');
  assert.equal(await page.locator('#pending-count').innerText(), '3', 'Wrong answers must be pending');
  assert.equal(await page.locator('#mistake-list details').count(), 3);
  await page.locator('#mistake-list details').first().locator('summary').click();
  assert(await page.locator('#mistake-list details').first().locator('img').getAttribute('src'), 'Question image must load on review');
  assert((await page.locator('#mistake-list details').first().innerText()).includes('正解：'), 'Correct answer missing');
  assert(await page.locator('#mistake-list details').first().locator('.explanation a').count() > 0, 'External explanation link missing');
  await page.locator('#mistake-list details').first().locator('button').click();
  assert.equal(await page.locator('#pending-count').innerText(), '2', 'Reviewed state not persisted');
  await page.locator('#filter').selectOption('all');
  assert.equal(await page.locator('#mistake-list details').count(), 3);
  await page.reload();
  assert.equal(await page.locator('#pending-count').innerText(), '2', 'Review state lost on reload');

  // A completed annual exam must contribute wrong answers to the same notebook.
  await page.goto(base + 'practice/');
  await page.evaluate(() => {
    const answers = Array(25).fill(null);
    answers[10] = 'ア'; // 2021 question 11 correct answer is イ
    const startedAt = Date.now() - 90_000;
    localStorage.setItem('sa-am2-year-v2:2021r03h', JSON.stringify({
      version: 2, yearId: '2021r03h', answers, index: 10, startedAt, finishedAt: startedAt + 85_000
    }));
  });
  await page.goto(base + 'practice/year/result/?year=2021r03h');
  await page.waitForFunction(() => document.getElementById('score').textContent === '0');
  await page.goto(base + 'practice/review/');
  assert.equal(await page.locator('#total-count').innerText(), '4', 'Annual mistake not imported');
  await page.reload();
  assert.equal(await page.locator('#total-count').innerText(), '4', 'Annual mistake was double-counted');
  await page.locator('#filter').selectOption('all');
  assert((await page.locator('#mistake-list').innerText()).includes('令和3年'), 'Annual question missing from notebook');

  // A new random attempt must not erase accumulated mistakes.
  await page.goto(base + 'practice/random/');
  page.once('dialog', dialog => dialog.accept());
  await page.evaluate(() => document.getElementById('restart').click());
  await page.goto(base + 'practice/review/');
  assert.equal(await page.locator('#total-count').innerText(), '4', 'Random restart erased mistake history');

  assert.deepEqual(errors, []);
  console.log('PASS: random modes, persistent mistake notebook, annual imports, reviewed states and explanations');
} finally {
  await browser?.close();
  server.kill();
}

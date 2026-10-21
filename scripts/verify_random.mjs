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
  assert.deepEqual(errors, []);
  console.log('PASS: normal/rapid feedback colors, auto-advance, toggle, reload, reset');
} finally {
  await browser?.close();
  server.kill();
}

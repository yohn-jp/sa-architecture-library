// Exercise the built reader under the exact GitHub Pages project prefix.
import assert from 'node:assert/strict';
import { mkdtemp, symlink, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = await mkdtemp(join(tmpdir(), 'sa-reader-'));
const base = 'http://127.0.0.1:4173/sa-architecture-library/';
await symlink(resolve('dist'), join(root, 'sa-architecture-library'));
const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1', '--directory', root], { stdio: 'ignore' });
const errors = [];
server.on('error', error => errors.push(error.message));
let browser;
try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try { ready = (await fetch(base)).ok; } catch { /* Server may still be starting. */ }
    if (ready) break;
    await delay(100);
  }
  assert(ready, 'Preview server did not start');
  const routes = [];
  for (const volume of await readdir('src/content/books', { withFileTypes: true })) {
    if (!volume.isDirectory()) continue;
    for (const file of (await readdir(`src/content/books/${volume.name}`)).sort()) {
      if (!file.endsWith('.md')) continue;
      const source = await readFile(`src/content/books/${volume.name}/${file}`, 'utf8');
      if (/^draft:\s*true\s*$/m.test(source)) continue;
      routes.push(`books/${volume.name}/${file.slice(0, -3)}/`);
    }
  }
  assert(routes.length > 0, 'No reading routes');
  browser = await chromium.launch();
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  const watch = page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
  };
  watch(page);
  for (const route of routes) {
    assert((await page.goto(base + route)).ok(), `Cannot open ${route}`);
    const body = page.locator('.reading-body');
    assert((await body.innerText()).includes('出典と照合範囲'), `Source notes missing in ${route}`);
    assert.equal(await body.evaluate(el => getComputedStyle(el).fontSize), '17px', `Reading CSS not applied: ${route}`);
    const width = await body.evaluate(el => el.getBoundingClientRect().width);
    assert(width > 500 && width <= 780, `Desktop reading measure invalid: ${width}`);
  }
  await page.goto(base + routes[0]);
  await page.locator('#reading-size').selectOption('19');
  await page.locator('#reading-theme').click();
  await page.locator('#mark-read').click();
  await page.reload();
  assert.equal(await page.locator('#reading-size').inputValue(), '19');
  assert.equal(await page.locator('.reading-body').evaluate(el => getComputedStyle(el).fontSize), '19px');
  assert.equal(await page.locator('#reading-theme').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#mark-read').getAttribute('aria-pressed'), 'true');

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await mobile.newPage();
  watch(phone);
  for (const route of routes) {
    await phone.goto(base + route);
    assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Mobile horizontal overflow: ${route}`);
  }
  assert.equal(await phone.locator('.reading-nav').getAttribute('open'), null);
  await phone.locator('.reading-nav > summary').click();
  assert.notEqual(await phone.locator('.reading-nav').getAttribute('open'), null);
  await phone.locator('.recall > summary').click();
  assert.notEqual(await phone.locator('.recall').getAttribute('open'), null);

  await page.goto(base + 'search/');
  const input = page.locator('.pagefind-ui__search-input');
  await input.fill('八十分');
  await page.waitForFunction(() => [...document.querySelectorAll('.pagefind-ui__result-link')].some(a => a.href.includes('/books/requirements/01/')), { timeout: 15000 });
  const result = page.locator('.pagefind-ui__result-link').filter({ hasText: /./ }).first();
  assert((await result.getAttribute('href')).includes('/sa-architecture-library/'), 'Search result escaped project prefix');
  await input.fill('サーキットブレーカー');
  await page.waitForFunction(() => [...document.querySelectorAll('.pagefind-ui__result-link')].some(a => a.href.includes('/complete/')), { timeout: 15000 });
  const complete = page.locator('.pagefind-ui__result-link[href*="/complete/"]').first();
  await complete.click();
  assert(page.url().startsWith(base + 'complete/'), 'Original textbook search target is broken');
  assert(await page.locator('#ch-07').count(), 'Original textbook chapter missing');

  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const plain = await noScript.newPage();
  await plain.goto(base + routes[0]);
  assert((await plain.locator('.reading-body').innerText()).length > 2000, 'Reader requires JavaScript');
  assert.equal(await plain.locator('.reading-tools').isVisible(), false);
  assert.deepEqual(errors, [], 'Browser errors or failed local resource requests');
  console.log(`PASS: ${routes.length} reading pages; desktop/mobile CSS, no overflow, reading preferences, disclosure controls, Japanese search and JavaScript-free reading`);
} finally {
  await browser?.close();
  server.kill();
  await rm(root, { recursive: true, force: true });
}

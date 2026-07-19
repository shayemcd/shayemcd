// Drives the app in demo mode with Playwright: sign in, log a workout,
// verify day-type detection, copy the partner's routine, log body weight.
// Playwright is installed globally in this environment; ESM needs the full path.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const server = createServer(async (req, res) => {
  let path = req.url.split('?')[0];
  if (path === '/') path = '/index.html';
  try {
    const data = await readFile(join(ROOT, path));
    res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('nope');
  }
});
await new Promise(r => server.listen(8765, r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('dialog', d => d.accept()); // accept confirm() prompts (e.g. replace-workout)
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const shot = name => page.screenshot({ path: join(ROOT, 'test', `shot-${name}.png`) });
let failed = false;
const check = (ok, label) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
};

// --- setup screen without demo param (config is placeholder) ---
await page.goto('http://localhost:8765/');
await page.waitForTimeout(400);
check(await page.locator('#screen-setup').isVisible(), 'setup checklist shows when config missing');

// --- demo mode: sign in ---
await page.goto('http://localhost:8765/?demo=1');
await page.waitForTimeout(400);
check(await page.locator('#screen-signin').isVisible(), 'sign-in screen shows in demo');
await page.click('#btn-signin');
await page.waitForTimeout(400);
check(await page.locator('#app').isVisible(), 'app visible after demo sign-in');
await shot('today-empty');

// --- log a workout: bench press via autocomplete ---
await page.fill('.autocomplete input', 'bench');
await page.waitForTimeout(200);
const firstItem = page.locator('.ac-item').first();
check((await firstItem.textContent()).includes('Bench Press'), 'autocomplete finds Bench Press');
await firstItem.click();
await page.waitForTimeout(300);
check(await page.locator('.exercise-name').first().textContent() === 'Bench Press', 'exercise added');
check((await page.locator('.set-table tbody tr').count()) === 3, 'three sets pre-added');

// fill reps/weights on first exercise
const rows = page.locator('.set-table tbody tr');
for (let i = 0; i < 3; i++) {
  await rows.nth(i).locator('input').nth(0).fill('8');
  await rows.nth(i).locator('input').nth(0).blur();
  await page.waitForTimeout(150);
  await page.locator('.set-table tbody tr').nth(i).locator('input').nth(1).fill('80');
  await page.locator('.set-table tbody tr').nth(i).locator('input').nth(1).blur();
  await page.waitForTimeout(150);
}

// add a triceps exercise -> day type should flip to Chest + Triceps
await page.fill('.autocomplete input', 'tricep pushdown');
await page.waitForTimeout(200);
await page.locator('.ac-item').first().click();
await page.waitForTimeout(300);
const badge = await page.locator('.badge').first().textContent();
check(badge.includes('Chest + Triceps'), `day type auto-detected (got "${badge}")`);
await shot('today-logged');

// --- plan tab ---
await page.click('[data-tab="plan"]');
await page.waitForTimeout(300);
const suggestion = await page.locator('.suggestion-card .badge').textContent();
check(suggestion.length > 0, `plan suggests a day ("${suggestion}")`);
check(!suggestion.includes('Chest'), 'suggestion avoids just-trained chest');
await shot('plan');

// --- partner tab: view & copy Akim's routine ---
await page.click('[data-tab="partner"]');
await page.waitForTimeout(300);
check((await page.locator('.view-title').textContent()).includes('Akim'), 'partner tab shows Akim');
const partnerCards = await page.locator('.workout-item').count();
check(partnerCards >= 2, `partner workouts listed (${partnerCards})`);
await page.locator('.workout-item').first().click();
await page.waitForTimeout(300);
check(await page.locator('.modal').isVisible(), 'partner workout detail opens');
const detail = await page.locator('.modal').textContent();
check(detail.includes('lbs') && detail.includes('kg'), 'weights shown in both units');
await shot('partner-detail');
await page.click('.modal .btn-primary'); // Copy to my log
await page.waitForTimeout(400);
check(await page.locator('#view .badge.partner').isVisible(), 'copied workout marked as partner routine');
const copiedNames = await page.locator('.exercise-name').allTextContents();
check(copiedNames.includes('Skull Crusher'), 'copied exercises present');
// bench press weight prefilled from my history (80)
const benchIdx = copiedNames.indexOf('Bench Press');
const prefill = await page.locator('.exercise-card').nth(benchIdx).locator('tbody tr').first().locator('input').nth(1).inputValue();
check(prefill === '80', `my last bench weight prefilled (got "${prefill}")`);
await shot('today-copied');

// --- history tab ---
await page.click('[data-tab="history"]');
await page.waitForTimeout(300);
const histCount = await page.locator('.workout-item').count();
check(histCount >= 3, `history lists both users (${histCount})`);

// --- weight tab ---
await page.click('[data-tab="weight"]');
await page.waitForTimeout(300);
await page.fill('#view input[type="number"]', '82.5');
await page.click('#view .btn-primary');
await page.waitForTimeout(400);
check((await page.locator('#view').textContent()).includes('82.5 kg'), 'body weight saved in kg');
check(await page.locator('canvas').isVisible(), 'weight chart canvas rendered');
const chartDrawn = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return c && c.width > 0;
});
check(chartDrawn, 'chart drawn');
await shot('weight');

// --- settings: switch to lbs, verify conversion shows up ---
await page.click('#btn-settings');
await page.waitForTimeout(200);
await page.click('.modal .chip:has-text("Pounds")');
await page.waitForTimeout(400);
check((await page.locator('#view').textContent()).includes('lbs'), 'unit switched to lbs');

const relevantErrors = errors.filter(e => !e.includes('manifest') && !e.includes('favicon') && !e.includes('Service worker'));
check(relevantErrors.length === 0, `no console/page errors${relevantErrors.length ? ':\n  ' + relevantErrors.join('\n  ') : ''}`);

await browser.close();
server.close();
process.exit(failed ? 1 : 0);

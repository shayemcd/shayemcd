// Drives the app in demo mode with Playwright: v1 flows (logging, day-type
// detection, partner copy via History, weight chart), v2 flows (compact set
// editor, cardio + kcal estimates, 7-day plan add-to-today, rest timer, AI
// meal estimation with shares & bank, macro dashboard, recap, watch data),
// and v3 flows (streak badge, theme toggle, desktop sidebar layout).
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
page.on('dialog', d => d.accept()); // accept confirm() prompts
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => {
  if (m.type() !== 'error') return;
  const url = m.location()?.url || '';
  errors.push(`console: ${m.text()} (${url})`);
});

const shot = name => page.screenshot({ path: join(ROOT, 'test', `shot-${name}.png`) });
let failed = false;
const check = (ok, label) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
};
const closeModals = async () => {
  while (await page.locator('.modal-backdrop').count()) {
    await page.locator('.modal-backdrop').last().click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(150);
  }
};

await page.goto('http://localhost:8765/?demo=1');
await page.waitForTimeout(400);
check(await page.locator('#screen-signin').isVisible(), 'sign-in screen shows in demo');
await page.click('#btn-signin');
await page.waitForTimeout(400);
check(await page.locator('#app').isVisible(), 'app visible after demo sign-in');

// --- Today: streak badge starts at zero ---
check((await page.locator('.streak-badge').textContent()).includes('start your streak'), 'streak badge shows zero-state before logging today');

// --- Today: compact editor ---
await page.fill('.autocomplete input', 'bench');
await page.waitForTimeout(200);
await page.locator('.ac-item').first().click();
await page.waitForTimeout(300);
check(await page.locator('.exercise-name').first().textContent() === 'Bench Press', 'exercise added');
check(await page.locator('.compact-editor').first().isVisible(), 'compact (all-sets) editor shown by default');
check((await page.locator('.stepper-value').first().textContent()) === '3', 'defaults to 3 sets');
check((await page.locator('.streak-badge').textContent()).includes('1-day streak'), 'streak badge flips to 1-day streak after logging today');

// set reps/weight once -> applies to every set
await page.locator('.exercise-card .compact-editor').first().locator('input').nth(0).fill('8');
await page.locator('.exercise-card .compact-editor').first().locator('input').nth(0).blur();
await page.waitForTimeout(250);
await page.locator('.exercise-card .compact-editor').first().locator('input').nth(1).fill('80');
await page.locator('.exercise-card .compact-editor').first().locator('input').nth(1).blur();
await page.waitForTimeout(300);
check(await page.locator('.kcal-chip').first().isVisible(), 'per-exercise kcal estimate shown');

// expand to per-set: 3 identical rows
await page.locator('.exercise-card', { hasText: 'Bench Press' }).locator('button', { hasText: 'Edit per set' }).click();
await page.waitForTimeout(250);
const rows = page.locator('.set-table tbody tr');
check((await rows.count()) === 3, 'expanded view shows 3 sets');
check(await rows.nth(2).locator('input').nth(0).inputValue() === '8', 'reps applied to all sets');
check(await rows.nth(2).locator('input').nth(1).inputValue() === '80', 'weight applied to all sets');
await page.locator('.exercise-card', { hasText: 'Bench Press' }).locator('button', { hasText: 'Collapse' }).click();
await page.waitForTimeout(250);

// triceps exercise -> day type flips
await page.fill('.autocomplete input', 'tricep pushdown');
await page.waitForTimeout(200);
await page.locator('.ac-item').first().click();
await page.waitForTimeout(300);
check((await page.locator('.badge').first().textContent()).includes('Chest + Triceps'), 'day type auto-detected');
check((await page.locator('#view').textContent()).includes('🔥'), 'workout total kcal badge shown');

// cardio entry
await page.fill('.autocomplete input', 'rowing');
await page.waitForTimeout(200);
await page.locator('.ac-item').first().click();
await page.waitForTimeout(300);
const rowCard = page.locator('.exercise-card', { hasText: 'Rowing Machine' });
check(await rowCard.locator('.compact-label', { hasText: 'Minutes' }).isVisible(), 'cardio logs minutes');
await rowCard.locator('input').fill('10');
await rowCard.locator('input').blur();
await page.waitForTimeout(250);
await shot('today-v3');

// rest timer
await page.locator('.exercise-card', { hasText: 'Bench Press' }).locator('[aria-label="Rest timer"]').click();
await page.waitForTimeout(150);
check(await page.locator('.timer-chip').isVisible(), 'rest timer presets appear');
await page.locator('.timer-chip .chip', { hasText: '60s' }).click();
await page.waitForTimeout(1300);
check(/0:5\d/.test(await page.locator('.timer-chip').textContent()), 'timer counts down');
await page.locator('.timer-chip .x-btn').click();

// --- Plan: suggestion + 7-day plan ---
await page.click('[data-tab="plan"]');
await page.waitForTimeout(300);
check((await page.locator('.suggestion-card .badge').textContent()).length > 0, 'plan suggests a day');
const weekCards = await page.locator('.week-day').count();
check(weekCards === 7, `7-day plan renders (${weekCards})`);
const firstTrain = page.locator('.week-day:not(.rest)').first();
const trainText = await firstTrain.textContent();
check(trainText.includes('min warm-up') && trainText.includes('Abs:') && trainText.includes('🧘'), 'plan day has cardio, abs, warm-down');
check((await firstTrain.locator('.plan-line', { hasText: '🏋️' }).count()) === 4, 'plan day has 4 weighted exercises');
await shot('plan-v3');
await firstTrain.locator('button', { hasText: '+ Add to today' }).click();
await page.waitForTimeout(400);
check((await page.locator('.exercise-card').count()) === 8, 'plan day added to today (cardio + 2 abs + 4 lifts + cooldown)');
check((await page.locator('#view').textContent()).includes('Stretching / Cool-down'), 'warm-down present');

// --- History: recap + partner copy ---
await page.click('[data-tab="history"]');
await page.waitForTimeout(300);
check((await page.locator('#view').textContent()).includes('Your last 7 days'), 'weekly recap card shown');
check(await page.locator('.stat-grid').isVisible(), 'recap stats grid renders');
check((await page.locator('.stat-grid').textContent()).includes('🔥 1d'), 'recap shows current streak');
const partnerCard = page.locator('.workout-item', { hasText: 'Akim' }).first();
await partnerCard.click();
await page.waitForTimeout(300);
const detail = await page.locator('.modal').textContent();
check(detail.includes('lbs') && detail.includes('kg'), 'partner weights shown in both units');
await page.click('.modal .btn-primary'); // Copy to my log (accepts replace confirm)
await page.waitForTimeout(400);
check(await page.locator('#view .badge.partner').isVisible(), 'copied workout marked as partner routine');
check((await page.locator('#view').textContent()).includes('Skull Crusher'), 'copied exercises present');
// Reps carry over from Akim's routine; weight is left for me to fill (my
// earlier bench log was replaced by the plan-day add, so no history remains).
const benchCompact = page.locator('.exercise-card', { hasText: 'Bench Press' }).locator('.compact-editor input');
check(await benchCompact.nth(0).inputValue() === '8', 'copied routine keeps partner reps');

// exercise trend chart from detail modal
await page.click('[data-tab="history"]');
await page.waitForTimeout(300);
await page.locator('.workout-item').first().click();
await page.waitForTimeout(250);
await page.locator('.modal .exercise-card').first().click();
await page.waitForTimeout(400);
check((await page.locator('.modal').last().textContent()).includes('📈'), 'exercise trend modal opens');
await closeModals();

// --- Meals ---
await page.click('[data-tab="meals"]');
await page.waitForTimeout(300);
check(await page.locator('.macro-row').first().isVisible(), 'macro dashboard renders');
check((await page.locator('.macro-row').count()) === 5, 'five macro bars (kcal + P/C/F/fiber)');
const seededMeal = page.locator('.workout-item', { hasText: 'Chicken & rice batch' });
check(await seededMeal.isVisible(), 'partner-shared seeded meal visible');
check((await seededMeal.textContent()).includes('your share: ¼'), 'my ¼ share of shared meal shown');

// describe-a-meal flow (mock AI in demo mode)
await page.locator('button', { hasText: '✏️ Describe' }).click();
await page.waitForTimeout(200);
await page.fill('.modal textarea', 'Grilled chicken, rice, broccoli');
await page.locator('.modal .btn-primary').click();
await page.waitForTimeout(500);
check((await page.locator('.modal').textContent()).includes('Check the estimate'), 'AI estimate review opens');
// give Akim half, save to bank
await page.locator('.modal .chip-row').nth(1).locator('.chip', { hasText: '½' }).click();
await page.locator('.modal input[type="checkbox"]').check();
await page.locator('.modal .btn-primary').click();
await page.waitForTimeout(400);
check((await page.locator('#view').textContent()).includes('Grilled chicken'), 'described meal logged');

// bank reuse
await page.locator('button', { hasText: '🗂 From bank' }).click();
await page.waitForTimeout(250);
const bankText = await page.locator('.modal').textContent();
check(bankText.includes('Grilled chicken') && bankText.includes('Overnight oats'), 'meal bank lists saved + seeded meals');
await closeModals();
await shot('meals');

// --- Weight: watch data + chart ---
await page.click('[data-tab="weight"]');
await page.waitForTimeout(300);
await page.locator('#view .card').first().locator('input').fill('82.5');
await page.locator('#view .card').first().locator('button', { hasText: /Save|Update/ }).click();
await page.waitForTimeout(400);
check((await page.locator('#view').textContent()).includes('82.5 kg'), 'body weight saved in kg');
// watch card manual entry
const watchCard = page.locator('.card', { hasText: "Today's watch data" });
await watchCard.locator('input').nth(0).fill('7.5');
await watchCard.locator('input').nth(1).fill('2900');
await watchCard.locator('input').nth(2).fill('10500');
await watchCard.locator('button', { hasText: 'Save watch data' }).click();
await page.waitForTimeout(400);
check(await page.locator('.card', { hasText: "Today's watch data" }).locator('input').nth(0).inputValue() === '7.5', 'watch sleep persisted');
check(await page.locator('canvas').first().isVisible(), 'weight chart canvas rendered');
const chartDrawn = await page.evaluate(() => !!window.Chart && document.querySelector('canvas')?.width > 0);
check(chartDrawn, 'Chart.js loaded and chart drawn');
await shot('weight-v3');

// recap should now include watch + meal data
await page.click('[data-tab="history"]');
await page.waitForTimeout(300);
const recapText = await page.locator('.card', { hasText: 'Your last 7 days' }).textContent();
check(recapText.includes('2900'), 'recap picks up watch calories-out');

// --- Settings: goal + unit + theme ---
await page.click('#btn-settings');
await page.waitForTimeout(200);
check((await page.locator('.modal').textContent()).includes('Nutrition goal'), 'settings shows goal picker');
check((await page.locator('.modal').textContent()).includes('Appearance'), 'settings shows appearance picker');
await page.locator('.modal .chip', { hasText: 'Build muscle' }).click();
await page.locator('.modal .btn-primary', { hasText: 'Save' }).click();
await page.waitForTimeout(300);
await page.click('[data-tab="weight"]');
await page.waitForTimeout(300);
await page.click('#btn-settings');
await page.waitForTimeout(200);
await page.locator('.modal .chip:has-text("Pounds")').click();
await page.waitForTimeout(400);
check((await page.locator('#view').textContent()).includes('Trend (lbs'), 'unit switched to lbs');

// theme toggle: switch to Light, verify data-theme + persistence across reload
await page.click('#btn-settings');
await page.waitForTimeout(200);
await page.locator('.modal .chip', { hasText: 'Light' }).click();
await page.waitForTimeout(200);
let themeAttr = await page.evaluate(() => document.documentElement.dataset.theme);
check(themeAttr === 'light', `theme switches to light (got "${themeAttr}")`);
await closeModals();
await shot('light-theme');
await page.reload();
await page.waitForTimeout(500);
themeAttr = await page.evaluate(() => document.documentElement.dataset.theme);
check(themeAttr === 'light', `theme persists across reload (got "${themeAttr}")`);
// restore dark for a clean final screenshot state
await page.click('#btn-settings');
await page.waitForTimeout(200);
await page.locator('.modal .chip', { hasText: 'Dark' }).click();
await page.waitForTimeout(200);
await closeModals();

// --- Desktop: sidebar layout kicks in at >=900px ---
await page.setViewportSize({ width: 1280, height: 900 });
await page.waitForTimeout(300);
const sidebarBox = await page.locator('.tabbar').boundingBox();
check(sidebarBox.x === 0 && sidebarBox.width < 300 && sidebarBox.height > 700, `sidebar nav at desktop width (box: ${JSON.stringify(sidebarBox)})`);
const mainMarginLeft = await page.locator('main#view').evaluate(el => getComputedStyle(el).marginLeft);
check(parseInt(mainMarginLeft) > 200, `content offset for sidebar (margin-left: ${mainMarginLeft})`);
await page.click('[data-tab="today"]');
await page.waitForTimeout(300);
check(await page.locator('.tab.active').getAttribute('data-tab') === 'today', 'sidebar nav item still clickable/active at desktop width');
await shot('desktop-sidebar');

// back to mobile for a final sanity check that the bottom bar returns
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
const mobileBar = await page.locator('.tabbar').boundingBox();
check(mobileBar.width > 350, `bottom tab bar spans full width on mobile again (width: ${mobileBar.width})`);

// Google Fonts is blocked by this sandbox's outbound proxy (same class of
// issue as the jsdelivr CDN earlier in the session) -- the live GitHub Pages
// site already serves Inter from the same CDN successfully for
// shayemhopkins.com, so this is a sandbox limitation, not a product bug.
const relevantErrors = errors.filter(e =>
  !e.includes('manifest') && !e.includes('favicon') && !e.includes('Service worker')
  && !e.includes('fonts.googleapis.com') && !e.includes('fonts.gstatic.com')
  && !e.includes('CONNECTION_RESET'));
check(relevantErrors.length === 0, `no console/page errors${relevantErrors.length ? ':\n  ' + relevantErrors.join('\n  ') : ''}`);

await browser.close();
server.close();
process.exit(failed ? 1 : 0);

// Evidence screenshots of the built prototype (Chromium emulation, not a device). Writes PNGs to the evidence folder.
import { chromium } from 'file:///D:/repos/MathKX/.claude/worktrees/round-04-verification-fdb318/Prototype/mathkx-designsystemet/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const root = 'D:/repos/MathKX/.claude/worktrees/round-04-verification-fdb318/Prototype/mathkx-designsystemet/';
const out = process.argv[2];
const html = readFileSync(`${root}dist/index.html`);
const server = createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const results = [];
async function shot(name, lang, viewport, colorScheme, steps) {
  const ctx = await browser.newContext({ viewport, colorScheme, hasTouch: true });
  await ctx.addInitScript((l) => { try { localStorage.setItem('mathkx-proto-prefs-v2', JSON.stringify({ lang: l })); } catch {} }, lang);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const btn = (n) => page.getByRole('button', { name: n, exact: true }).first();
  const type = async (v) => { const f = page.locator('[data-answer-input="true"]').first(); await f.fill(v); await f.press('Enter'); await page.waitForTimeout(200); };
  try {
    await steps({ page, btn, type, go: async (h) => { await page.goto(`${base}#${h}`); await page.waitForTimeout(400); } });
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => ({ docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: document.querySelector('h1')?.innerText, lang: document.documentElement.lang }));
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    results.push({ name, lang, viewport, colorScheme, ...m, pageErrors: errors });
  } catch (e) { results.push({ name, error: e.message.split('\n')[0] }); } finally { await ctx.close(); }
}
const ADD = 'arithmetic.add-within-20';
await shot('01-practice-help-counting-nb-820', 'nb', { width: 820, height: 1180 }, 'light', async ({ go, btn }) => {
  await go(`/practice/${ADD}?variant=within-10`); await btn('Vis visuell hjelp').click(); await btn('Hjelp meg å telle').click(); await btn('Tell videre fra 4').click();
  for (let i = 0; i < 3; i++) await btn('Tell neste brikke').click();
});
await shot('02-explanation-reveal-confirm-en-390', 'en', { width: 390, height: 844 }, 'dark', async ({ go, btn }) => {
  await go(`/practice/${ADD}?variant=across-10`); await btn('Explain the solution').click();
});
await shot('03-explanation-last-step-en-390', 'en', { width: 390, height: 844 }, 'dark', async ({ go, btn }) => {
  await go(`/practice/${ADD}?variant=across-10`); await btn('Explain the solution').click(); await btn('Open the explanation').click();
  for (let i = 0; i < 3; i++) await btn('Next step').click();
});
await shot('04-challenge-pending-more-like-this-en-1180', 'en', { width: 1180, height: 820 }, 'light', async ({ go, page }) => {
  await go(`/practice/${ADD}?variant=within-10`); await page.getByRole('button', { name: /^More challenge/ }).first().click();
});
await shot('05-session-summary-with-draft-nb-820', 'nb', { width: 820, height: 1180 }, 'light', async ({ go, btn, page }) => {
  await go(`/practice/${ADD}?variant=within-10`); await page.locator('[data-answer-input="true"]').fill('1'); await btn('Avslutt økten').click();
});
await shot('06-check-policy-en-390', 'en', { width: 390, height: 844 }, 'light', async ({ go }) => { await go('/check/check-addition'); });
await shot('07-check-summary-after-switch-nb-820', 'nb', { width: 820, height: 1180 }, 'light', async ({ go, btn, type }) => {
  await go('/check/check-addition'); await btn('Start sjekken').click(); await type('10'); await btn('Jeg trenger hjelp').click(); await btn('Bytt til øving med hjelp').click(); await type('9'); await btn('Neste oppgave').click(); await btn('Hopp over').click(); await btn('Hopp over og se oppsummeringen').click();
});
await shot('08-progress-after-check-en-820', 'en', { width: 820, height: 1180 }, 'light', async ({ go, btn, type }) => {
  await go('/check/check-addition'); await btn('Start the check').click(); await type('10'); await btn('I need help').click(); await btn('Switch to supported practice').click(); await type('9'); await go(`/progress/${ADD}`);
});
await shot('09-lesson-detour-banner-en-820', 'en', { width: 820, height: 1180 }, 'light', async ({ go, btn }) => {
  await go(`/practice/${ADD}?variant=across-10`); await btn('Read in the lesson').click(); await btn('Open the lesson (shows the answer)').click();
});
await shot('10-profile-step3-email-choice-en-390', 'en', { width: 390, height: 844 }, 'light', async ({ go, btn, page }) => {
  await go('/profile/new'); await page.getByLabel('Choose a password', { exact: true }).fill('tiervenner99'); await page.getByLabel('Enter the password again', { exact: true }).fill('tiervenner99');
  await page.getByRole('button', { name: /^Create the profile/ }).click(); await page.getByLabel('I have saved my ID and will remember my password').check(); await page.getByRole('button', { name: /^Continue/ }).first().click();
});
await shot('11-signin-with-guest-work-nb-390', 'nb', { width: 390, height: 844 }, 'dark', async ({ go, type }) => {
  await go(`/practice/${ADD}?variant=within-10`); await type('8'); await go('/signin');
});
await shot('12-practice-simulated-keyboard-nb-390', 'nb', { width: 390, height: 844 }, 'light', async ({ go, page }) => {
  await go(`/practice/${ADD}?variant=across-10`); await page.getByLabel('Simuler skjermtastatur').check(); await page.waitForTimeout(400);
});
await browser.close(); server.close();
console.log(JSON.stringify(results, null, 2));

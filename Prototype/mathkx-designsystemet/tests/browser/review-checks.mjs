// Browser checks for the round-03 review findings (prototype, not a production suite).
//
//   npm run build
//   npx playwright install chromium   # once
//   npm run test:browser              # all configurations
//   npm run test:browser -- en-390-dark
//
// Each scenario reproduces a reviewer's steps on dist/index.html and checks the
// fixed behaviour. Selectors use the app's own strings (src/i18n.js), so the same
// scenario runs in Norwegian Bokmål and English. axe-core runs on the main routes.
// This is Chromium emulation: it is not an iPad, Safari or screen-reader test.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { translate, pick } from '../../src/i18n.js';
import { variants } from '../../src/domain/practice.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distFile = `${root}dist/index.html`;
if (!existsSync(distFile)) { console.error('Run `npm run build` first.'); process.exit(2); }
const html = readFileSync(distFile);
const axeSrc = readFileSync(`${root}node_modules/axe-core/axe.min.js`, 'utf8');

const CONFIGS = {
  'nb-820-light': { lang: 'nb', viewport: { width: 820, height: 1180 }, colorScheme: 'light' },
  'en-390-dark': { lang: 'en', viewport: { width: 390, height: 844 }, colorScheme: 'dark' },
  'en-1180-light': { lang: 'en', viewport: { width: 1180, height: 820 }, colorScheme: 'light' },
  'nb-390-dark': { lang: 'nb', viewport: { width: 390, height: 844 }, colorScheme: 'dark' },
};
const only = process.argv[2];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ADD = 'arithmetic.add-within-20';
const LIN = 'algebra.solve-x-plus-a';

const server = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const results = [];

async function scenario(cfgName, cfg, name, fn) {
  const ctx = await browser.newContext({ viewport: cfg.viewport, colorScheme: cfg.colorScheme, hasTouch: true });
  await ctx.addInitScript((lang) => {
    try { if (!localStorage.getItem('mathkx-proto-prefs-v2')) localStorage.setItem('mathkx-proto-prefs-v2', JSON.stringify({ lang })); } catch { /* ignore */ }
  }, cfg.lang);
  // Offline-friendly: skip the optional web font (the system font is the fallback).
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Web fonts are optional (the system font is the fallback); ignore network failures for them.
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const T = (k, p) => translate(cfg.lang, k, p);
  const V = (id) => pick(cfg.lang, variants[id].title);
  const h = {
    page, T, V, lang: cfg.lang,
    go: async (hash) => { await page.goto(`${base}#${hash.replace(/^#/, '')}`); await page.waitForTimeout(150); },
    btn: (name, exact = true) => page.getByRole('button', { name: exact ? name : new RegExp(`^${esc(name)}`) }).first(),
    link: (name) => page.getByRole('link', { name }).first(),
    answer: () => page.locator('[data-answer-input="true"]').first(),
    text: async () => (await page.locator('main').innerText()),
    expectText: async (s, why) => { await page.getByText(s, { exact: false }).first().waitFor({ timeout: 3000 }).catch(() => { throw new Error(`${why ?? 'expected text'}: “${s}”`); }); },
    expectNoText: async (s, why) => { if ((await page.locator('main').innerText()).includes(s)) throw new Error(`${why ?? 'unexpected text'}: “${s}”`); },
    submit: async (v) => { await h.answer().fill(v); await h.answer().press('Enter'); await page.waitForTimeout(120); },
    assert: (c, msg) => { if (!c) throw new Error(msg); },
  };
  try {
    await h.go('/');
    await fn(h);
    if (errors.length) throw new Error(`console/page errors: ${errors.slice(0, 2).join(' | ')}`);
    results.push({ cfg: cfgName, name, ok: true });
  } catch (e) {
    results.push({ cfg: cfgName, name, ok: false, msg: e.message.split('\n')[0] });
  } finally { await ctx.close(); }
}

const SCENARIOS = {
  'R03-01 Home and progress render during and after a check, boundary kept': async ({ go, btn, submit, T, expectText, page }) => {
    await go('/check/check-addition');
    await btn(T('check.start')).click();
    await submit('10');
    await go('/home');
    await page.getByRole('heading', { level: 1 }).first().waitFor();
    await expectText(T('home.recent'), 'Home did not render');
    await go(`/progress/${ADD}`);
    await expectText(T('progress.sessions'), 'Progress did not render');
    await go('/check/check-addition');
    await btn(T('check.needHelp')).click();
    await btn(T('check.switchYes')).click();
    await submit('9');
    await btn(T('check.nextQuestion')).click();
    await btn(T('check.skip')).click();
    await btn(T('check.skipLast')).click();
    await expectText(T('check.supportedTitle', { i: 2 }));
    await go(`/progress/${ADD}`);
    await expectText(T('check.supportedTitle', { i: 2 }), 'progress lost the supported boundary');
    await expectText(T('check.modeIndependent'));
    await go('/home');
    await expectText(T('home.fromCheckSupported'), 'Home lost the supported boundary');
  },
  'R03-02 Reading the lesson before answering is recorded (reveal and plain help)': async ({ go, btn, submit, T, expectText, page }) => {
    await go(`/practice/${ADD}?variant=across-10`);
    await btn(T('ex.openLesson')).click();
    await expectText(T('ex.lessonRevealTitle', { q: '8 + 5' }), 'no disclosure warning for 8 + 5');
    await btn(T('ex.lessonRevealYes')).click();
    await btn(T('lesson.returnBtn')).click();
    await submit('13');
    await expectText(T('ex.outcome.revealed_lesson'), 'outcome after lesson reveal');
    await expectText(T('support.reveal_lesson'));
    await btn(T('practice.another')).click();
    await btn(T('ex.openLesson')).click();
    await btn(T('lesson.returnBtn')).waitFor({ timeout: 3000 }); // 9 + 4: the lesson does not show it, no warning
    await btn(T('lesson.returnBtn')).click();
    await submit('13');
    await expectText(T('ex.outcome.correctWithHelp'), 'outcome after plain lesson help');
    await btn(T('practice.finish')).click();
    await expectText(T('session.solved1'), 'summary counts only answers before a reveal');
    await expectText(T('session.afterReveal', { n: 1 }));
  },
  'R03-03 Counting all is an answer reveal; part of the explanation is help': async ({ go, btn, submit, T, expectText }) => {
    await go(`/practice/${ADD}?variant=within-10`);
    await btn(T('ex.showHelp')).click();
    await btn(T('help.countStep')).click();
    await btn(T('help.countOn', { a: 4 })).click();
    for (let i = 0; i < 3; i++) await btn(T('help.countNext')).click();
    await expectText(T('help.countNextReveals'), 'no warning before the last counter');
    await btn(T('help.countNext')).click();
    await expectText(T('help.countDoneNote'));
    await submit('8');
    await expectText(T('ex.outcome.revealed_counting'), 'counting all not treated as a reveal');
    await btn(T('practice.another')).click();
    await btn(T('ex.explain')).click();
    await expectText(T('ex.revealTitle'));
    await btn(T('ex.revealYes')).click();
    await btn(T('help.nextStep')).click();
    await expectText(T('ex.nextReveals'), 'no warning before the revealing step');
    await btn(T('ex.hideExplain')).click();
    await submit('8');
    await expectText(T('ex.outcome.correctWithHelp'), 'part of explanation recorded as reveal');
    await expectText(T('support.explainPartBefore'));
  },
  'R03-04 More like this says it replaced a pending change': async ({ go, btn, T, expectText, V, page }) => {
    await go(`/practice/${ADD}?variant=across-10`);
    await btn(T('practice.easier'), false).click();
    await expectText(T('practice.nextWillBe', { variant: V('within-10') }));
    await btn(T('practice.same'), false).click();
    await expectText(T('practice.droppedPending', { variant: V('across-10'), dropped: V('within-10') }), 'no notice that the change was dropped');
    await page.getByText(V('across-10'), { exact: true }).first().waitFor();
  },
  'R03-04b A challenge change does not bring back the link’s variant prompt': async ({ go, btn, T, page, submit }) => {
    await go(`/practice/${ADD}?variant=within-10`);
    await submit('8');
    await btn(T('practice.harder'), false).click();
    await btn(T('practice.another')).click();
    const prompts = await page.getByRole('button', { name: new RegExp(esc(T('practice.startRequested', { requested: '§' }).split('§')[0])) }).count();
    if (prompts) throw new Error('session-in-progress prompt appeared after the learner’s own change');
  },
  'C9 Starting a new variation ends the old session with a summary': async ({ go, btn, T, expectText, page }) => {
    await go(`/practice/${ADD}?variant=within-10`);
    await go('/home');
    await go(`/practice/${ADD}?variant=within-5`);
    await page.getByRole('button', { name: new RegExp(esc(T('practice.startRequested', { requested: '§' }).split('§')[0])) }).first().click();
    await expectText(T('practice.replacedNotice'));
    await page.getByRole('link', { name: T('practice.replacedLink') }).click();
    await expectText(T('session.replacedNote'));
  },
  'R03-06 Balance check step pictures 4 in place of x': async ({ go, btn, submit, T, page }) => {
    await go(`/practice/${LIN}`);
    await submit('x = 4');
    await btn(T('ex.explain')).click();
    for (let i = 0; i < 3; i++) await btn(T('help.nextStep')).click();
    const n = await page.locator(`[aria-label*="${T('help.inPlaceOfX')}"]`).count();
    if (!n) throw new Error('check step has no substituted picture');
    if (await page.locator('.mkx-ws-panel .mkx-xbox').count()) throw new Error('x box still shown on the check step');
  },
  'R03-07 Finish keeps an unanswered question resumable with its draft': async ({ go, btn, T, expectText, page }) => {
    await go(`/practice/${ADD}?variant=within-10`);
    await page.locator('[data-answer-input="true"]').fill('1');
    await btn(T('practice.finish')).click();
    await expectText(T('session.resumeTitle'));
    await go('/home');
    await expectText(T('home.cont.resumeTyped', { q: '4 + 4', a: '1' }), 'Home does not offer the unfinished question');
    await page.getByRole('link', { name: T('home.continueBtn') }).click();
    await page.waitForTimeout(200);
    const v = await page.locator('[data-answer-input="true"]').inputValue();
    if (v !== '1') throw new Error(`draft not restored (got “${v}”)`);
    await expectText(T('practice.resumedTag'));
  },
  'C6 + R03-08 8 + 5 final step fits; step player labels resolve': async ({ go, btn, T, page }) => {
    await go(`/practice/${ADD}?variant=across-10`);
    await btn(T('ex.explain')).click();
    await btn(T('ex.revealYes')).click();
    for (let i = 0; i < 3; i++) await btn(T('help.nextStep')).click();
    const m = await page.evaluate(() => {
      const chain = document.querySelector('.mkx-eqchain');
      const panel = chain.closest('.mkx-panel').getBoundingClientRect();
      const parts = [...chain.querySelectorAll('.mkx-eqpart')].map((p) => p.getBoundingClientRect());
      const missing = [...document.querySelectorAll('[aria-labelledby]')].flatMap((el) => el.getAttribute('aria-labelledby').split(/\s+/).filter((id) => !document.getElementById(id)));
      return { overflow: chain.scrollWidth - chain.clientWidth, outside: parts.filter((r) => r.right > panel.right + 1).length, docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, missing, last: chain.innerText.trim().split(/\s+/).at(-1) };
    });
    if (m.overflow > 1 || m.outside) throw new Error(`equation overflows (${JSON.stringify(m)})`);
    if (m.docOverflow > 0) throw new Error(`page scrolls sideways by ${m.docOverflow}px`);
    if (m.missing.length) throw new Error(`aria-labelledby targets missing: ${m.missing.join(', ')}`);
  },
  'R03-05b One way on in a supported check; fresh check from the topic': async ({ go, btn, T, submit, page, expectText }) => {
    await go('/check/check-addition');
    await btn(T('check.start')).click();
    await btn(T('check.needHelp')).click();
    await btn(T('check.switchYes')).click();
    if (await page.getByRole('button', { name: T('check.nextQuestion') }).count()) throw new Error('both Next and Skip offered before answering');
    for (let i = 0; i < 3; i++) await btn(T('check.skip')).click();
    await btn(T('check.skipLast')).click();
    await expectText(T('check.summaryTitle'));
    await go('/topic/arithmetic.addition-within-20');
    await page.getByRole('link', { name: T('topic.startCheck') }).first().click();
    await expectText(T('check.policyTitle'), 'Check my understanding did not open a fresh check');
    await btn(T('check.lastSummary')).click();
    await expectText(T('check.summaryTitle'));
  },
  'C7 + C8 Guest work is labelled on create and on sign-in import': async ({ go, btn, T, submit, page, expectText }) => {
    await go(`/practice/${ADD}?variant=within-10`);
    await submit('8');
    await go('/profile/new');
    await page.getByLabel(T('profile.password'), { exact: true }).fill('tiervenner99');
    await page.getByLabel(T('profile.password2'), { exact: true }).fill('tiervenner99');
    await btn(T('profile.create'), false).click();
    await page.getByLabel(T('profile.confirmSaved')).check();
    await btn(T('profile.continue'), false).click();
    await btn(T('profile.noEmail')).click();
    await btn(T('profile.goHome'), false).click();
    await expectText(T('home.fromGuest'), 'guest work absorbed into a new profile is not labelled');
    // Sign out, do guest work, sign in to the demo profile and import it
    await go('/settings');
    await btn(T('settings.signOut')).click();
    await go(`/practice/${ADD}?variant=within-10`);
    await go('/signin');
    await btn(T('signin.useDemo')).click();
    await page.getByLabel(T('signin.guestImport')).check();
    await btn(T('signin.submit')).click();
    await go(`/progress/${ADD}`);
    await expectText(T('progress.endedImported'), 'imported session not marked as history');
    await go('/home');
    await expectText(T('home.cont.typed', { q: '9 + 4', a: '1', n: 2 }), 'continue card is not the profile’s own place');
  },
  'C11 Plural and labels': async ({ go, T, submit, expectText }) => {
    await go(`/practice/${ADD}?variant=within-10`);
    await submit('fire');
    await submit('8');
    await go(`/progress/${ADD}`);
    await expectText(T('progress.invalid1'));
  },
  'C12 Touch targets are at least 44 px (lesson, practice with a pending change)': async ({ go, page, btn, T }) => {
    const measure = () => page.evaluate(() => [...document.querySelectorAll('main a, main button')].filter((el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (!r.width || cs.visibility === 'hidden' || el.closest('p, li > p, td, .ds-paragraph, figcaption')) return false; // inline links in running text are exempt (WCAG 2.5.8)
      return r.height < 44 && !el.closest('.mkx-prose');
    }).map((el) => `${el.tagName.toLowerCase()} “${el.textContent.trim().slice(0, 30)}” ${Math.round(el.getBoundingClientRect().height)}px`));
    await go('/lesson/number-bonds-to-ten');
    let small = await measure();
    await go(`/practice/${ADD}?variant=across-10`);
    await btn(T('practice.easier'), false).click();
    small = small.concat(await measure());
    if (small.length) throw new Error(`under 44 px: ${small.slice(0, 5).join('; ')}`);
  },
  'G1 Explanation after an incorrect answer asks first and is recorded once': async ({ go, btn, submit, T, expectText, page }) => {
    await go(`/practice/${ADD}?variant=across-10`);
    await submit('12');
    await btn(T('ex.explain')).click();
    await expectText(T('ex.revealTitle'), 'no warning before revealing after an incorrect answer');
    await btn(T('ex.revealYes')).click();
    for (let i = 0; i < 3; i++) await btn(T('help.nextStep')).click();
    await submit('13');
    await expectText(T('support.reveal_explanation'));
    if (await page.getByText(T('support.explainAfter'), { exact: true }).count()) throw new Error('both "answer shown" and "explanation after" tags');
  },
  'G2 Easier then harder clears the change instead of pointing at the current variation': async ({ go, btn, T, expectText, page, V }) => {
    await go(`/practice/${ADD}?variant=within-10`);
    await btn(T('practice.easier'), false).click();
    await btn(T('practice.harder'), false).click();
    await expectText(T('practice.cleared', { variant: V('within-10') }));
    if (await page.getByText(T('practice.nextWillBe', { variant: V('within-10') })).count()) throw new Error('pending change points at the current variation');
  },
  'G3 Check summary explains every item; G4 a part-done check is offered on Home': async ({ go, btn, submit, T, expectText, page }) => {
    await go('/check/check-addition');
    await btn(T('check.start')).click();
    await submit('10');
    await go('/home');
    await expectText(T('home.cont.check', { i: 2, n: 4 }), 'Home does not offer the part-done check');
    await page.getByRole('link', { name: T('home.continueBtn') }).click();
    await submit('9'); await submit('13'); await submit('13');
    await expectText(T('check.explanationsLead'));
    const n = await page.locator('main details').count();
    if (n < 4) throw new Error(`only ${n} explanations for 4 items`);
    await page.locator('main details summary').first().click();
    await page.getByRole('button', { name: T('help.nextStep') }).first().waitFor();
  },
  'G5 Simulated keyboard keeps the answer and Check visible': async ({ go, page, T }) => {
    await go(`/practice/${ADD}?variant=across-10`);
    await page.getByLabel(T('kbd.toggle')).check();
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const form = document.querySelector('[data-answer-input]').closest('form').getBoundingClientRect();
      const kb = document.querySelector('.mkx-kbd').getBoundingClientRect();
      return { formBottom: form.bottom, formTop: form.top, kbTop: kb.top };
    });
    if (m.formBottom > m.kbTop || m.formTop < 0) throw new Error(`answer hidden: ${JSON.stringify(m)}`);
  },
  'G6 Derivative: a typed x moves the point; the explanation asks first': async ({ go, page, btn, T, lang }) => {
    await go('/preview/derivative');
    const field = page.getByRole('textbox', { name: T('deriv.answerLabel') });
    await field.fill(lang === 'nb' ? '1,2' : '1.2');
    await field.press('Enter');
    await page.waitForTimeout(150);
    const out = await page.locator('output').first().innerText();
    if (!out.includes(lang === 'nb' ? '1,2' : '1.2')) throw new Error(`graph point not moved (${out})`);
    await btn(T('ex.explain')).click();
    await page.getByText(T('deriv.revealTitle')).first().waitFor();
    await btn(T('deriv.right')).click();
    const out2 = await page.locator('output').first().innerText();
    if (!out2.includes(lang === 'nb' ? '1,5' : '1.5')) throw new Error(`arrow did not snap to 1.5 (${out2})`);
  },
  'G7 Changing a confirmed email keeps the old one until the new one is confirmed': async ({ go, btn, T, page, expectText }) => {
    await go('/profile/new');
    await page.getByLabel(T('profile.password'), { exact: true }).fill('tiervenner99');
    await page.getByLabel(T('profile.password2'), { exact: true }).fill('tiervenner99');
    await btn(T('profile.create'), false).click();
    await page.getByLabel(T('profile.confirmSaved')).check();
    await btn(T('profile.continue'), false).click();
    await btn(T('profile.addEmail')).click();
    await page.getByLabel(T('profile.emailLabel')).fill('first@example.com');
    await btn(T('profile.sendCode')).click();
    await page.getByLabel(T('profile.code')).fill('246810');
    await btn(T('profile.verify')).click();
    await go('/settings');
    await btn(T('settings.change')).click();
    await page.getByLabel(T('profile.emailLabel')).fill('typo@example.com');
    await btn(T('profile.sendCode')).click();
    await btn(T('profile.verifyLater')).click();
    await expectText(T('profile.verifiedFor', { email: 'first@example.com' }), 'confirmed address was replaced before confirmation');
    await expectText(T('profile.pendingReplace', { email: 'typo@example.com', old: 'first@example.com' }));
  },
  'axe-core (WCAG 2 A/AA, 2.1 AA, best practice) on main routes': async ({ go, page, btn, T }) => {
    const routes = ['/', '/library', '/topic/arithmetic.addition-within-20', '/lesson/number-bonds-to-ten', '/lesson/equations-as-a-balance', `/practice/${ADD}?variant=across-10`, '/check/check-addition', `/progress/${ADD}?sample=1`, '/home', '/profile/new', '/signin', '/preview/derivative', '/about'];
    const found = [];
    for (const r of routes) {
      await go(r);
      if (r.startsWith('/practice')) { await btn(T('ex.showHelp')).click(); }
      await page.waitForTimeout(600); // let the short fade-in finish, or axe measures blended colours
      await page.addScriptTag({ content: axeSrc });
      const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations.map((x) => `${x.id} (${x.nodes.length})`));
      if (v.length) found.push(`${r}: ${v.join(', ')}`);
    }
    if (found.length) throw new Error(found.join(' | '));
  },
};

for (const [cfgName, cfg] of Object.entries(CONFIGS)) {
  if (only && only !== cfgName) continue;
  for (const [name, fn] of Object.entries(SCENARIOS)) await scenario(cfgName, cfg, name, fn);
}
await browser.close();
server.close();

let failed = 0;
for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  [${r.cfg}] ${r.name}${r.ok ? '' : `\n      ${r.msg}`}`); }
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

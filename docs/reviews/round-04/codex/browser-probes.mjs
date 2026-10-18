// Supplemental verification, separate from the unchanged repository browser suite.
import { chromium } from '../../../../Prototype/mathkx-designsystemet/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { translate } from '../../../../Prototype/mathkx-designsystemet/src/i18n.js';
const html=readFileSync(new URL('../../../../Prototype/mathkx-designsystemet/dist/index.html',import.meta.url));
const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(html);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch();
console.log(`Browser: Chromium ${browser.version()}; Windows; headless; no physical device or screen reader`);
const results=[];
try {
 for(const lang of ['nb','en']) {
  const ctx=await browser.newContext({viewport:{width:820,height:1180},reducedMotion:'reduce'});
  await ctx.addInitScript(lang=>localStorage.setItem('mathkx-proto-prefs-v2',JSON.stringify({lang})),lang);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/,route=>route.abort());
  const page=await ctx.newPage();page.setDefaultTimeout(5000);
  const t=(k,p)=>translate(lang,k,p);
  const btn=k=>page.getByRole('button',{name:t(k),exact:true});
  const go=async path=>{await page.goto(`${base}#${path}`);await page.locator('main h1').waitFor();};
  await go('/practice/arithmetic.add-within-20?variant=within-10');
  const answer=page.locator('[data-answer-input]');
  await answer.fill('7'); await answer.press('Enter');
  await btn('ex.showHelp').click();await answer.fill('8');await answer.press('Enter');
  await page.getByText(t('ex.outcome.correctAfterFeedback'),{exact:true}).waitFor();
  results.push({lang,probe:'wrong then visual help then correct',observedOutcome:t('ex.outcome.correctAfterFeedback'),planningAddendumExpected:'correctWithVisualHelp'});
  await btn('ex.explain').click();
  assert.equal(await btn('ex.revealYes').count(),0);
  results.push({lang,probe:'explanation after correct opens without pre-answer confirmation',passed:true});
  await btn('practice.another').click();
  await btn('ex.explain').click();await btn('ex.revealYes').click();await btn('help.nextStep').click();
  const labels=await page.locator('.mkx-ws-panel [role="img"][aria-label]').evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')));
  const snap=await page.locator('.mkx-ws-panel').ariaSnapshot();
  writeFileSync(new URL(`${lang}-pre-reveal-accessibility.txt`,import.meta.url),snap);
  results.push({lang,probe:'3 + 5 groups explanation step 2, before the marked revealing step',labels,answerRevealWarningVisible:await page.getByText(t('ex.nextReveals'),{exact:true}).isVisible(),issue:'accessible labels include total 8 before answer-reveal event'});
  await page.screenshot({path:fileURLToPath(new URL(`${lang}-pre-reveal.png`,import.meta.url)),fullPage:true});
  await btn('ex.hideExplain').click();
  // Keyboard traversal from answer to Check to help; Enter activates help.
  await answer.focus();await page.keyboard.press('Tab');
  const first=await page.locator(':focus').innerText();await page.keyboard.press('Tab');
  const second=await page.locator(':focus').innerText();await page.keyboard.press('Enter');
  assert.equal(first,t('ex.check'));assert.equal(second,t('ex.showHelp'));
  assert.equal(await btn('ex.hideHelp').getAttribute('aria-expanded'),'true');
  await answer.fill('8');
  await page.locator(`label[aria-label="${lang==='nb'?'English':'Norsk bokmål'}"]`).click();
  assert.equal(await answer.inputValue(),'8');
  await page.setViewportSize({width:1180,height:820});
  assert.equal(await answer.inputValue(),'8');
  const motion=await page.evaluate(()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,animations:[...document.querySelectorAll('.mkx-fade')].map(el=>getComputedStyle(el).animationName)}));
  results.push({lang,probe:'Tab/Enter help, draft retained through language switch and resize 820x1180 -> 1180x820, reduced-motion CSS',first,second,motion,passed:true});
  await page.locator(`label[aria-label="${lang==='nb'?'Norsk bokmål':'English'}"]`).click();
  await go('/profile/new');
  await page.getByLabel(t('profile.password'),{exact:true}).fill('verification99');
  await page.getByLabel(t('profile.password2'),{exact:true}).fill('verification99');
  await page.getByRole('button',{name:t('profile.create'),exact:false}).click();
  await page.getByLabel(t('profile.confirmSaved')).check();
  await page.getByRole('button',{name:t('profile.continue'),exact:false}).click();
  await btn('profile.addEmail').click();
  await page.getByLabel(t('profile.emailLabel')).fill('verification@example.com');
  await btn('profile.sendCode').click();await btn('profile.verifyLater').click();
  await page.getByText(t('profile.pendingFor',{email:'verification@example.com'}),{exact:true}).waitFor();
  results.push({lang,probe:'new profile with pending unverified email, Verify later',passed:true});
  await ctx.close();
 }
} catch(e) {results.push({probe:'harness failure',error:e.stack});process.exitCode=1;}
finally {console.log(JSON.stringify(results,null,2));await browser.close();server.close();}

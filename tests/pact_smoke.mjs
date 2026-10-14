// 本命契约开局习得 + 觉醒破界奥义 + 仓库星级/本命按钮 浏览器冒烟
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const shot = process.argv[3] || '';
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 576 } });
await ctx.addInitScript(() => { localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 2, done: [1], tutorialDone: true, character: 'sayo', shop40: { ops: { owned: { school_shrine: 5, school_gun: 3 }, pact: 'school_shrine' } } })); });
const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const r = await page.evaluate(() => { const a = window.__SAKURAYO_TEST__; a.start(); for (let i = 0; i < 30; i++) { if (a.snapshot().mode === 'dialogue') a.dismissDialogue(); window.advanceTime(100); } return a.pactState48(); });
assert.ok(r.pact && r.pact.id === 'school_shrine' && r.pact.got.length === 1, 'pact starter skill granted ' + JSON.stringify(r));
const b = await page.evaluate(() => window.__SAKURAYO_TEST__.breakBurst48(6));
assert.ok(b.before >= 6 && b.after === 0 && b.bursts === 1, 'break burst clears bullets ' + JSON.stringify(b));
assert.deepEqual(errors, [], 'no page errors');
if (shot) {
  await page.evaluate(() => { const a = window.__SAKURAYO_TEST__; a.backMenu(); a.setRosterTab46('school'); a.openDrawer('roster'); });
  await page.waitForTimeout(500); await page.screenshot({ path: shot + '_roster.png' });
  await page.locator('.rosterSlot46[data-card="school_shrine"]').click(); await page.waitForTimeout(300); await page.screenshot({ path: shot + '_peek.png' });
}
await browser.close();
console.log('PASS pact smoke: starter skill', r.pact.got, '· break burst cleared', b.before);

import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import http from 'node:http';
import fs from 'node:fs';
const target = process.argv[2] || 'src/index.html';
// Serve over http: chromium's file:// localStorage is not reliably kept across reloads
// under load, and this smoke asserts that receipts survive a reload.
const root = path.resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); res.end(data); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${path.relative(root, path.resolve(target)).split(path.sep).join('/')}?test=1`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { if (!localStorage.getItem('sakurayoV3')) { localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 3, done: [1, 2], tutorialDone: true })); }
  if (location.search.includes('unlock4')) { const s = JSON.parse(localStorage.getItem('sakurayoV3')); s.unlock = 4; localStorage.setItem('sakurayoV3', JSON.stringify(s)); } });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(url); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
// real entry: lobby nav -> trials drawer
await page.locator('#menu .homeNav46 button', { hasText: '试炼' }).tap();
await page.locator('#trialsDrawer:not(.hidden) .trialTab46').first().waitFor();
await page.locator('.trialTab46[data-trial="flawless"]').tap();
assert.equal(await page.locator('#trialGo46').isDisabled(), true, 'flawless locked before chapter 4');
await page.locator('.trialTab46[data-trial="sealed"]').tap();
await page.locator('#trialGo46').tap();
assert.equal((await api('trialState')).active, 'sealed');
await page.locator('#trialBadge46:not(.hidden)').waitFor();
// sealed: level-up does not open choices
await api('start'); await api('dismissDialogue');
await api('triggerUpgrade');
assert.equal(await page.locator('#level').isHidden(), true, 'sealed shows no upgrade cards');
await api('finish', true);
let st = await api('trialState');
assert.equal(st.result.success, true); assert.equal(st.result.reward, 180);
await page.locator('#trialResult46.ok').waitFor();
// retry keeps trial, repeat clear pays nothing
await page.locator('#again').click();
assert.equal((await api('trialState')).active, 'sealed');
await api('dismissDialogue');
await api('finish', true);
st = await api('trialState'); assert.equal(st.result.reward, 0);
const coins = await page.evaluate(() => JSON.parse(localStorage.getItem('sakurayoV3')).coins);
// back to lobby clears
await page.locator('#back').click();
assert.equal((await api('trialState')).active, null);
assert.equal(await page.locator('#trialBadge46').isHidden(), true);
// reload keeps receipt, no double pay
await page.waitForFunction(() => JSON.parse(localStorage.getItem('sakurayoV3')).shop40?.ops?.trials?.receipts?.sealed === 1);
await page.reload(); await page.locator('.bootArt35').waitFor({ state: 'detached' });
st = await api('trialState');
assert.equal(st.store.receipts.sealed, 1);
assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('sakurayoV3')).coins), coins);
// solo: initial weapon only (no sub-weapon cards), damage grows with kills; stage change clears
assert.equal(await api('trial', 'solo'), 'solo');
await api('start'); await api('dismissDialogue');
assert.equal((await api('poolIds46', 30)).some(id => id.startsWith('w_')), false, 'solo offers no sub-weapon cards');
assert.equal(await api('soloBonus46'), 1);
await api('finish', false);
st = await api('trialState'); assert.equal(st.result.success, false); assert.equal(st.store.receipts.solo, undefined);
await page.locator('#back').click();
await api('trial', 'solo'); await api('setRunMode46', 'testimony');
assert.equal((await api('trialState')).active, null, 'mode change clears trial');
// flawless: hurt -> fail
// patch before boot so the app's own unload persist cannot race the edit
await page.goto(url + '&unlock4'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
await api('setRunMode46', 'story');
assert.equal(await api('trial', 'flawless'), 'flawless');
await api('start'); await api('dismissDialogue');
await api('spawnEnemyNear', 'normal', 10);
for (let i = 0; i < 20; i++) await page.evaluate(() => window.advanceTime(100));
await api('finish', true);
st = await api('trialState');
assert.equal(st.result.success, false); assert.equal(st.result.reason, 'hurt');
await page.locator('#trialResult46.fail').waitFor();
await page.locator('#again').click(); await api('dismissDialogue');
await api('protectPlayer');
await api('finish', true);
st = await api('trialState');
assert.equal(st.result.success, true); assert.equal(st.result.reward, 240);
assert.equal(errors.length, 0, errors.join('\n'));
console.log('PASS trials smoke: entry, gate, sealed no cards, receipt once, retry keeps, back/mode clear, solo initial-weapon only, reload receipt', JSON.stringify(st.result));
await browser.close();
server.close();

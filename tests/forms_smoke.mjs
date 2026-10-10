// 形态（P1）：面具摊节点 → 形态卡选择 → 变身演出 → 规则参数与配色生效 → 跨节点不重复叠加 → Boss 阶段应对形态 → 第 4 阶段觉醒 10 秒。
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('f46')) { sessionStorage.setItem('f46', 1); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 2, done: [1], tutorialDone: true, character: 'sayo' })); } });
const page = await ctx.newPage(); const errors = []; page.on('console', m => /BOSSFAIL/.test(m.text()) && console.log(m.text())); page.on('pageerror', e => errors.push(String(e)));
await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const tick = (n = 1) => page.evaluate(n => { const a = window.__SAKURAYO_TEST__; for (let i = 0; i < n; i++) { const m = a.snapshot().mode; if (m === 'dialogue') a.dismissDialogue(); else if (m === 'level') a.chooseUpgrade(0); window.advanceTime(100); } }, n);
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
await api('runStart46', 777);
async function win() { await api('protectPlayer'); await api('runWinNode46'); await api('runContinue46'); }
// row 0 fight → row 1 last → row 2 mask
let st = await api('runState46'); await api('runEnter46', st.available[0].id); await win();
st = await api('runState46'); const r1 = st.available.at(-1); await api('runEnter46', r1.id); st = await api('runState46');
if (st.mode === 'play') await win(); else { await api('runChoose46', 0); st = await api('runState46'); if (st.modal) await api('runSkipModal46'); }
st = await api('runState46'); const mask = st.available.find(n => n.type === 'mask'); assert.ok(mask, 'mask stall reachable ' + JSON.stringify(st.available));
await api('runEnter46', mask.id);
assert.equal(await page.locator('#run46 .rm46 .opts.forms button img').count(), 3, 'three form cards with portraits');
await page.locator('#run46 .rm46 .opts.forms button').nth(0).click();
assert.ok(await page.locator('#formCut46').count(), 'transformation cut-in plays on the map');
let f = await api('formState46'); assert.equal(f.form.id, 'sayo_guard'); assert.equal(f.form.switches['1'], 1);
assert.match(await page.locator('#run46 .r46Foot').innerText(), /镜盾哨兵/);
// next combat node: mods + tint applied once
for (let k = 0; k < 6; k++) { st = await api('runState46'); const n = st.available[0]; await api('runEnter46', n.id); st = await api('runState46'); if (st.mode === 'play') break; await api('runChoose46', 0); st = await api('runState46'); if (st.modal) await api('runSkipModal46'); }
f = await api('formState46'); assert.equal(f.p.id, 'sayo_guard'); assert.equal(f.p.tint, '#7fd8ff', 'form palette on sprite/bullets');
const spd1 = f.spd; await win();
for (let k = 0; k < 6; k++) { st = await api('runState46'); const n = st.available[0]; await api('runEnter46', n.id); st = await api('runState46'); if (st.mode === 'play') break; await api('runChoose46', 0); st = await api('runState46'); if (st.modal) await api('runSkipModal46'); }
f = await api('formState46'); assert.ok(Math.abs(f.spd - spd1) < 1e-6, 'form mods do not stack across nodes ' + [f.spd, spd1]);
// boss phases inside this combat node: spawn a boss through the level API if needed
await api('protectPlayer');
const hasBoss = await page.evaluate(() => { const a = window.__SAKURAYO_TEST__; let err = ""; try { a.spawnBossNow(); } catch (e) { err = String(e); } if (!a.bossDebug46()) console.log("BOSSFAIL", a.snapshot().mode, err); return !!a.bossDebug46(); });
if (hasBoss) {
  await api('bossPhase46', 2);
  for (let i = 0; i < 30 && !(await api('formState46')).pick; i++) await tick();
  f = await api('formState46'); assert.ok(f.pick && f.pause, 'boss phase offers a counter form and pauses');
  await api('formPickFirst46'); f = await api('formState46'); assert.equal(f.pause, false); assert.equal(f.form.switches['1'], 1, 'boss switch is free');
  await api('bossPhase46', 3); await tick(5); await api('bossPhase46', 4); await tick(5); await api('formCharge46', 100);
  await tick();
  f = await api('formState46'); assert.match(f.btn || '', /ready/, 'awaken button ready in phase 4');
  await page.keyboard.press('f'); f = await api('formState46'); assert.equal(f.p.id, 'sayo_awaken'); assert.ok(f.dmgTaken < 1);
  await tick(115);
  f = await api('formState46'); assert.notEqual(f.p.id, 'sayo_awaken', 'awaken ends after 10 s');
} else assert.fail('boss could not be spawned');
assert.deepEqual(errors, []);
await browser.close();
console.log('PASS forms: mask stall cards + cut-in, palette, no stacking, boss counter-form, awaken 10 s');

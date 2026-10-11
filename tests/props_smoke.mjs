// Map props + burst: chests pay coins into the result, crates break on contact, traps detonate, burst needs full charge.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 4, done: [1, 2, 3], tutorialDone: true })));
const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1');
await page.locator('.bootArt35').waitFor({ state: 'detached' });
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
const step = ms => page.evaluate(ms => window.advanceTime(ms), ms);
for (const sid of [1, 4]) {
  await api('selectStage', sid); await api('start'); await api('dismissDialogue'); await api('protectPlayer'); await step(50);
  const props = await api('props46');
  const kinds = k => props.filter(p => p.kind === k).length;
  assert.ok(kinds('crate') >= 4 && kinds('chest') >= 2 && kinds('shrine') >= 1 && kinds('trap') >= 1, `chapter ${sid} has every prop kind`);
  const snap = await api('snapshot');
  for (const p of props) assert.ok(Math.hypot(p.x - snap.player.x, p.y - snap.player.y) >= 250, 'spawn area stays clear');
  if (sid === 1) var first = props; else assert.notDeepEqual(props.map(p => p.kind).join(), first.map(p => p.kind).join(), 'chapters differ in layout');
  await api('backMenu');
}
// walk the player onto a chest via teleport helper
await api('selectStage', 1); await api('start'); await api('dismissDialogue'); await api('protectPlayer'); await step(50);
const chest = (await api('props46')).find(p => p.kind === 'chest');
await page.evaluate(c => window.__SAKURAYO_TEST__.teleport46(c.x, c.y), chest); await step(50);
assert.equal((await api('props46')).find(p => p.kind === 'chest' && p.x === chest.x).done, true, 'chest opens on touch');
assert.equal(await page.evaluate(() => window.SakurayoBattle46.state().ult < 100), true);
assert.equal(await page.evaluate(() => window.SakurayoBattle46.ult()), false, 'burst refuses without charge');
while ((await api('snapshot')).mode === 'level') await api('chooseUpgrade', 0);
await api('chargeUlt46');
assert.equal(await page.evaluate(() => window.SakurayoBattle46.ult()), true, 'burst fires when charged');
assert.equal(await page.evaluate(() => window.SakurayoBattle46.state().ult), 0);
await page.locator('#ultCut46').waitFor({ state: 'attached' });
const mm = await page.evaluate(() => window.SakurayoBattle46.minimap());
assert.ok(mm.chests.length >= 1 && mm.player && mm.cam.w > 0, 'minimap data');
await browser.close();
assert.deepEqual(errors, []);
console.log('PASS props: per-chapter props, clear spawn, chest touch, burst charge gate, cut-in, minimap');

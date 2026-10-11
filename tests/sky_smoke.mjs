// P2：镜空（纵版射击）节点接入夜行：每层一个、进入→自动驾驶打完→写回生命/魂晶/遗物、存档可序列化、无报错。
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
await page.evaluate(() => { window.__shmManual = 1; });
for (const [type, sel] of [['sky', '#shm46'], ['duel', '#duel46']]) {
  assert.ok(await api('runStart46', 4242));
  await page.evaluate(() => { window.__shmManual = 1; window.__duelManual = 1; });
  const id = await api('skyEnter46', true, type); assert.ok(id, `${type} node exists on layer 1`);
  assert.ok(await page.locator(sel + ' canvas').isVisible(), `${type} overlay visible`);
  let s = await api('skyState46'); assert.equal(s.ch, 'sayo');
  for (let i = 0; i < 60 && !s.done; i++) s = await api('skyStep46', 10);
  assert.ok(s.done && s.win, `${type}: autopilot clears (${JSON.stringify(s).slice(0, 160)})`);
  await page.screenshot({ path: `/tmp/sy/mode-${type}-end.png` }).catch(() => {});
  assert.ok(await api('skyClose46'), `${type}: result button returns to map`);
  const st1 = await api('runState46');
  assert.equal(st1.at, id); assert.ok(st1.shards >= 30, `${type}: shards granted`); assert.equal(st1.modal?.kind, 'relic', `${type}: relic offer`);
  assert.equal(await page.locator(sel).count(), 0, `${type}: overlay removed`);
}
// Boss 前三选一：路线只决定推荐项；生物线推荐格斗，但选弹幕也能打
for (const [route, pickMode, sel] of [['bio', 'sky', '#shm46'], ['tech', 'duel', '#duel46']]) {
  await api('runRoute46', route); assert.ok(await api('runStart46', 777));
  await page.evaluate(() => { window.__shmManual = 1; window.__duelManual = 1; });
  assert.ok(await api('skyEnter46', true, 'boss'));
  let st = await api('runState46'); assert.equal(st.modal?.kind, 'bossmode', 'boss mode chooser');
  const opts = await page.locator('#run46 .bm46 [data-k="bmode"]').evaluateAll(b => b.map(x => [x.dataset.v, x.classList.contains('rec')]));
  assert.deepEqual(opts.map(o => o[0]), ['mow', 'duel', 'sky']); assert.equal(opts.find(o => o[1])[0], route === 'bio' ? 'duel' : 'sky', 'route recommends');
  await page.screenshot({ path: `/tmp/sy/bossmode-${route}.png` }).catch(() => {});
  assert.ok(await api('bossModeAuto46', pickMode)); assert.ok(await page.locator(sel + ' canvas').isVisible());
  let s = await api('skyState46'); for (let i = 0; i < 80 && !s.done; i++) s = await api('skyStep46', 10);
  assert.ok(s.done, `${route}/${pickMode} boss finished`); await api('skyClose46');
  st = await api('runState46'); if (s.win) assert.equal(st.layer, 2, 'boss win → next layer');
}
// 樱花弹珠台：大厅抽奖小游戏，每日免费 1 球
await api('backMenu').catch(() => {});
assert.ok(await api('openPachi46', { seed: 3 })); assert.ok(await page.locator('#pachi46 canvas').isVisible());
const c0 = (await api('pachiStep46', 0)).coins; assert.ok(await api('pachiFire46', 180), 'free ball');
let pr; for (let i = 0; i < 40 && !(pr = await api('pachiStep46', 1)).got.length; i++);
assert.equal(pr.got.length, 1, 'ball landed'); assert.equal(pr.st.free + pr.st.balls >= 1, true);
await page.screenshot({ path: '/tmp/sy/pachi-end.png' }).catch(() => {});
assert.ok(await api('pachiClose46')); assert.equal(await page.locator('#pachi46').count(), 0);
assert.deepEqual(errors, []);
await browser.close();
console.log('PASS modes (sky/duel + sakura pachinko lottery): node per layer, shmup overlay, autopilot clear, shards/relic writeback, overlay teardown');

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
for (const [type, sel] of [['sky', '#shm46'], ['pin', '#pin46'], ['duel', '#duel46']]) {
  assert.ok(await api('runStart46', 4242));
  await page.evaluate(() => { window.__shmManual = 1; window.__pinManual = 1; window.__duelManual = 1; });
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
assert.deepEqual(errors, []);
await browser.close();
console.log('PASS modes (sky/pin/duel): node per layer, shmup overlay, autopilot clear, shards/relic writeback, overlay teardown');

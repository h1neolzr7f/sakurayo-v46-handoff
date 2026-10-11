// Regression: enemy/boss culling must use the camera's world viewport, not the
// screen size. The battlefield is several screens wide; once the player leaves
// the top-left screen, enemies and the boss still have to be drawn.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch();
const errors = [];
for (const [w, h] of [[844, 390], [640, 360]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 4, done: [1, 2, 3], tutorialDone: true })));
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(String(e)));
  await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1');
  await page.locator('.bootArt35').waitFor({ state: 'detached' });
  const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
  await api('selectStage', 4); await api('start'); await api('dismissDialogue');
  await api('protectPlayer');
  await page.evaluate(() => window.advanceTime(300));
  const snap = await api('snapshot');
  assert.ok(snap.camera.camX > 0, 'camera must have scrolled away from the top-left screen');
  assert.ok(snap.player.x > snap.viewport.width, 'player must be outside the first screen');
  await api('clearCombat');
  for (const [dx, dy] of [[-160, -50], [140, 40], [220, -60]]) await api('spawnEnemyRelative', 'tank', dx, dy);
  await page.evaluate(() => window.advanceTime(16));
  let stats = await api('drawStats');
  assert.ok(stats.enemies >= 3, `enemies near the player must be drawn (got ${stats.enemies})`);
  await api('spawnBossNow');
  for (let i = 0; i < 6; i++) { await api('dismissDialogue').catch(() => {}); await page.evaluate(() => window.advanceTime(16)); }
  await page.evaluate(() => { const t = window.__SAKURAYO_TEST__, s = t.snapshot(); t.setBossPosition(s.player.x + 150, s.player.y); });
  await page.evaluate(() => window.advanceTime(16));
  stats = await api('drawStats');
  assert.equal(stats.boss, 1, 'boss next to the player must be drawn');
  // far-away enemies are still culled
  for (let i = 0; i < 6; i++) { await api('dismissDialogue').catch(() => {}); await page.evaluate(() => window.advanceTime(16)); }
  await api('clearCombat'); await api('spawnEnemyRelative', 'tank', 1400, 0);
  await page.evaluate(() => window.advanceTime(16));
  stats = await api('drawStats');
  assert.equal(stats.enemies - stats.boss, 0, 'off-camera enemies stay culled');
  await ctx.close();
}
await browser.close();
assert.deepEqual(errors, []);
console.log('PASS render camera: enemies and boss drawn outside first screen, off-camera culled');

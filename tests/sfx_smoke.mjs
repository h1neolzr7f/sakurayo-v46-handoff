import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { if (!localStorage.getItem('sakurayoV3')) localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 5000, unlock: 3, done: [1, 2], tutorialDone: true })); });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
// every recipe renders real non-silent audio offline
const rendered = await page.evaluate(async () => {
  const L = window.SakurayoSfxLib, out = {};
  for (const k of L.keys) {
    const c = new OfflineAudioContext(1, 44100 * 1.4, 44100);
    const ok = L.play(c, k, 0.8);
    const buf = await c.startRendering(), d = buf.getChannelData(0);
    let peak = 0; for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    out[k] = { ok, peak };
  }
  return out;
});
for (const [k, r] of Object.entries(rendered)) {
  assert.equal(r.ok, true, k + ' plays');
  assert.ok(r.peak > 0.002 && r.peak <= 1, k + ' audible and not clipping: ' + r.peak);
}
assert.ok(Object.keys(rendered).length >= 24);
// zero gain is silent and refused
assert.equal(await page.evaluate(() => window.SakurayoSfxLib.play(new OfflineAudioContext(1, 4410, 44100), 'hit', 0)), false);
// routing: drawers, gacha reveal, toast all reach sound()
await page.evaluate(() => { window.__sfx = []; const f = window.SakurayoSfx; window.SakurayoSfx = k => { window.__sfx.push(k); return f(k); }; });
await page.locator('#menu .homeNav46 [data-open=gacha]').click();
await page.waitForFunction(() => window.__sfx.includes('open'));
await page.locator('#gachaPull10').click();
await page.locator('#gachaReveal46').waitFor();
await page.waitForTimeout(1600);
const keys = await page.evaluate(() => window.__sfx);
assert.ok(keys.includes('pull'), 'pull sound ' + keys.join());
assert.ok(keys.some(k => /^(flip|revealSR|revealSSR)$/.test(k)), 'card flip sounds');
// low HP vignette in battle
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
await api('start'); await api('dismissDialogue');
await api('setPlayerHpRatio', 0.2);
await page.evaluate(() => window.advanceTime(50));
assert.equal(await page.locator('#hud.lowHp46').count(), 1, 'low hp vignette');
await api('setPlayerHpRatio', 1);
await page.evaluate(() => window.advanceTime(50));
assert.equal(await page.locator('#hud.lowHp46').count(), 0, 'vignette clears');
assert.equal(errors.length, 0, errors.join('\n'));
console.log('PASS sfx smoke:', Object.keys(rendered).length, 'recipes render, drawer/gacha routing, low-HP vignette');
await browser.close();

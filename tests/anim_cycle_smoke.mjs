// Idle / run / hit animation cycles: every in-between frame must play, and the sprite's body box
// (height, ground line, head anchor) must stay stable across frames so nothing pops or flickers.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 4, tutorialDone: true })));
const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const run = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
await run('selectCharacter', 'sayo'); await run('selectStage', 1); await run('start'); await run('dismissDialogue'); await run('protectPlayer');
async function frames(n, key) {
  await page.evaluate(() => window.__SAKURAYO_TEST__.poseLog46().length = 0);
  for (let f = 0; f < n; f++) await page.evaluate(([key, f]) => { const a = window.__SAKURAYO_TEST__; a.clearCombat(); for (const q of 'wasd') dispatchEvent(new KeyboardEvent('keyup', { key: q })); if (key) dispatchEvent(new KeyboardEvent('keydown', { key: f % 60 < 30 ? key : 'a' })); window.advanceTime(1000 / 30); }, [key, f]);
  return page.evaluate(() => [...window.__SAKURAYO_TEST__.poseLog46()]);
}
const idle = await frames(45, null);
for (const f of ['idle', 'idle_ab', 'idle_b', 'idle_bc', 'idle_c', 'idle_ca']) assert.ok(idle.includes(f), `待机循环缺少 ${f}`);
const runP = await frames(45, 'd');
for (let i = 0; i < 8; i++) assert.ok(runP.includes('run_' + i), `跑动循环缺少 run_${i}`);
// frame-to-frame body box stability measured on the shipped sprites
const ART = pathToFileURL(path.resolve('android-app/app/src/main/assets/game/art')).href;
const stab = await page.evaluate(async (ART) => {
  const out = {};
  for (const c of ['sayo', 'aya', 'rion']) {
    const box = async (p) => { const im = new Image(); im.src = `${ART}/characters/${c}/default/anim_${p}.webp`; await im.decode(); const cv = new OffscreenCanvas(512, 512), g = cv.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, 512, 512).data; let t = 512, b = 0; for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) if (d[(y * 512 + x) * 4 + 3] > 200) { if (y < t) t = y; if (y > b) b = y; } return { t, b }; };
    const set = ['idle', 'idle_ab', 'idle_b', 'idle_bc', 'idle_c', 'idle_ca', 'run_0', 'run_1', 'run_2', 'run_3', 'run_4', 'run_5', 'run_6', 'run_7', 'hit', 'hit_m', 'hit_b'];
    const bs = []; for (const p of set) bs.push(await box(p));
    const still = bs.filter((q, i) => !set[i].startsWith('run_')), contact = bs.filter((q, i) => /^run_[0246]$/.test(set[i])), air = bs.filter((q, i) => /^run_[1357]$/.test(set[i]));
    out[c] = { contactGround: Math.max(...contact.concat(still).map(q => q.b)) - Math.min(...contact.concat(still).map(q => q.b)), flight: Math.max(...still.map(q => q.b)) - Math.min(...air.map(q => q.b)), groundSpread: Math.max(...bs.map(q => q.b)) - Math.min(...bs.map(q => q.b)), heightSpread: Math.max(...bs.map(q => q.b - q.t)) / Math.min(...bs.map(q => q.b - q.t)) };
  }
  return out;
}, ART);
for (const [c, s] of Object.entries(stab)) { assert.ok(s.contactGround <= 4, `${c} 落地帧脚底线漂移 ${s.contactGround}px`); assert.ok(s.flight <= 22, `${c} 腾空帧离地过高 ${s.flight}px`); assert.ok(s.heightSpread <= 1.12, `${c} 身高跳变 ${s.heightSpread.toFixed(2)}`); }
assert.deepEqual(errors, []);
await browser.close();
console.log('PASS anim cycles: idle 6 / run 8 frames all play; sprite ground & height stable', JSON.stringify(stab));

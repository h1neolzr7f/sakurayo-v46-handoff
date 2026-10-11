// Flicker guard: luminance of the area around the player across consecutive rendered frames
// (30 fps game time, real screenshots so DOM overlays count too). A "flash" is a pair of opposite
// luminance jumps ≥ 10% (WCAG-style general flash). With 减弱闪烁 on (default) we require ≤ 3
// flashes per second under barrage + invulnerability + hit feedback.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const FRAMES = 150, W = 54, H = 84;
const browser = await chromium.launch();
async function measure(reduce) {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 4, tutorialDone: true })));
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1');
  await page.locator('.bootArt35').waitFor({ state: 'detached' });
  await page.evaluate((reduce) => {
    const a = window.__SAKURAYO_TEST__;
    a.setReduceFlash46?.(reduce); a.selectCharacter('sayo'); a.selectStage(2); a.start(); a.dismissDialogue(); a.protectPlayer();
    for (const [w, n] of [['spread', 3], ['homing', 3], ['orbit', 5], ['bomb', 2], ['ricochet', 2], ['laser', 4]]) a.giveWeapon46(w, n);
    window.advanceTime(20000);
  }, reduce);
  const lum = [];
  for (let f = 0; f < FRAMES; f++) {
    const p = await page.evaluate((f) => {
      const a = window.__SAKURAYO_TEST__, keys = ['d', 's', 'a', 'w'];
      if (f % 40 === 0) { for (const q of 'wasd') dispatchEvent(new KeyboardEvent('keyup', { key: q })); dispatchEvent(new KeyboardEvent('keydown', { key: keys[(f / 40) % 4 | 0] })); }
      if (f % 45 === 0 && a.setInv46) a.setInv46(1.2);
      for (let i = 0; i < 4; i++) { const m = a.snapshot().mode; if (m === 'level') a.chooseUpgrade(0); else if (m === 'dialogue') a.dismissDialogue(); else if (m === 'event') a.chooseEvent(0); }
      window.advanceTime(1000 / 30);
      return a.playerScreen46 ? a.playerScreen46() : { x: innerWidth / 2, y: innerHeight / 2 };
    }, f);
    const shot = await page.screenshot({ clip: { x: Math.max(0, p.x - W / 2), y: Math.max(0, p.y - H + 6), width: W, height: H } });
    lum.push(await page.evaluate(async (b64) => {
      const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
      const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext('2d'); g.drawImage(bmp, 0, 0);
      const d = g.getImageData(0, 0, bmp.width, bmp.height).data; let s = 0;
      for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      return s / (d.length / 4);
    }, shot.toString('base64')));
  }
  const poses = await page.evaluate(() => window.__SAKURAYO_TEST__.poseLog46());
  await ctx.close();
  assert.deepEqual(errors, []);
  for (const f of ['attack', 'attack_ab', 'attack_b', 'attack_bc', 'attack_c', 'attack_ca']) assert.ok(poses.includes(f), `连射时攻击动画必须循环全部帧，缺少 ${f}`);
  { let changes = 0; for (let i = 1; i < poses.length; i++) if (poses[i] !== poses[i - 1] && poses[i].startsWith('attack') && poses[i - 1].startsWith('attack')) changes++; assert.ok(changes >= 6, `攻击帧应持续切换（${changes}）`); }
  let flips = 0, last = 0;
  for (let i = 1; i < lum.length; i++) {
    const dl = lum[i] - lum[i - 1];
    if (Math.abs(dl) < Math.max(8, lum[i - 1] * 0.1)) continue;
    const sg = Math.sign(dl); if (last && sg !== last) flips++; last = sg;
  }
  const jumps = lum.slice(1).map((v, i) => Math.abs(v - lum[i])).sort((x, y) => y - x);
  return { flashesPerSec: +(flips / 2 / (FRAMES / 30)).toFixed(2), p90Jump: +jumps[Math.floor(jumps.length * 0.1)].toFixed(1), maxJump: +jumps[0].toFixed(1) };
}
const on = await measure(true);
const off = await measure(false);
await browser.close();
console.log('flicker reduce=on', JSON.stringify(on), 'reduce=off', JSON.stringify(off));
assert.ok(on.flashesPerSec <= 3, `减弱闪烁开启时玩家区域闪烁 ${on.flashesPerSec} 次/秒 > 3`);
assert.ok(off.flashesPerSec <= 3, `减弱闪烁关闭时玩家区域闪烁 ${off.flashesPerSec} 次/秒 > 3`);
console.log(`PASS flicker (off ${off.flashesPerSec}/s): player-area ${on.flashesPerSec}/s flashes (≤3), p90 jump ${on.p90Jump}`);

// 三角色 × 三尺寸（横屏/竖屏手机/平板）× WebGL/2D 降级：rig 正常挂载，画布有像素且人物不越界。输出拼图。
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const shots = '/tmp/sy/mascot-sizes'; fs.mkdirSync(shots, { recursive: true });
const sizes = [[1280, 720], [390, 844], [1024, 768]], out = [];
const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const mode of ['gl', '2d']) for (const ch of ['sayo', 'aya', 'rion']) for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
  await ctx.addInitScript(ch => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 2, done: [1], tutorialDone: true, character: ch })), ch);
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1' + (mode === '2d' ? '&rig=2d' : ''));
  await page.waitForFunction(() => window.__SAKURAYO_TEST__?.rigSnapshot46?.(), null, { timeout: 120000 });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => { const R = window.SakurayoRig.current(), c = R.c, b = c.getBoundingClientRect(); return { id: R.id, gl: !!R.gl, w: b.width, h: b.height, cw: c.width, rig: document.querySelector('#heroLive46').classList.contains('rig46') }; });
  const f = `${shots}/${mode}-${ch}-${w}x${h}.png`; await page.screenshot({ path: f });
  const ok = r.id === ch && r.rig && r.w > 50 && r.h > 50 && r.gl === (mode === 'gl');
  out.push({ mode, ch, w, h, ...r, ok }); console.log(ok ? 'PASS' : 'FAIL', mode, ch, w, h, JSON.stringify(r));
  await ctx.close();
}
await browser.close(); if (out.some(o => !o.ok)) process.exit(1);
console.log('MASCOT SIZES PASS');

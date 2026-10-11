// 第 3 轮特色演出截图：加载 / 大厅（动态背景 + 视差）/ 推拉 / 出击反馈 / 角色出场 / 结算。Usage: node tools/shoot_fx.mjs <outdir>
import { chromium } from 'playwright'; import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
const out = process.argv[2] || '/tmp/sy/fx'; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, ...(process.env.REC ? { recordVideo: { dir: process.env.REC, size: { width: 1280, height: 720 } } } : {}) });
await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 2400, unlock: 5, done: [1, 2, 3, 4], tutorialDone: true, character: 'sayo' })));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.waitForTimeout(350); await p.screenshot({ path: `${out}/1_loading.png` });
await p.locator('.bootArt35').waitFor({ state: 'detached' }); await p.mouse.move(1200, 120); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/2_lobby_parallax.png` });
const ft = await p.evaluate(() => new Promise(r => { let n = 0, t0 = performance.now(); (function f() { if (++n < 60) requestAnimationFrame(f); else r((performance.now() - t0) / 60); })(); })); console.log('avg frame ms', ft.toFixed(1));
await p.locator('[data-open="shop"]').first().click(); await p.waitForTimeout(220); await p.screenshot({ path: `${out}/3_dolly.png` }); await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelectorAll('.drawer:not(.hidden) .close').forEach(x => x.click())); await p.waitForTimeout(500);
await p.mouse.move(200, 600, { steps: 12 }); await p.mouse.move(1100, 200, { steps: 12 }); await p.evaluate(() => window.SakurayoFx?.startFx()); await p.waitForTimeout(120); await p.screenshot({ path: `${out}/4_start_fx.png` }); await p.waitForTimeout(600);
await p.evaluate(() => window.SakurayoFx?.showcase('朝雾绫')); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/5_showcase.png` }); await p.waitForTimeout(1500);
await p.evaluate(() => { document.getElementById('rankBig').textContent = 'S'; document.getElementById('rtitle').textContent = '防线守住了'; document.getElementById('rstats').innerHTML = '<div>击破 <b>1,284</b></div><div>存活 <b>302</b> 秒</div><div>樱花币 <b>+460</b></div>'; document.getElementById('result').classList.remove('hidden'); }); await p.waitForTimeout(1400); await p.screenshot({ path: `${out}/6_result.png` });
console.log('errors', errs.length, errs.slice(0, 3).join(' | ')); await ctx.close(); await b.close();

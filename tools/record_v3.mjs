// Offline 30 fps capture: lobby → 夜行 roguelike map → node → STORY v3 chapter-1 AVG (1-1 opening, 1-4 ending twist).
// Usage: node tools/record_v3.mjs <frames-dir> <shots-dir>
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const out = process.argv[2] || '/tmp/sy/v3rec', shots = process.argv[3] || '/workspace/sakurayo-shots';
fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 2, done: [1], tutorialDone: true, character: 'sayo', stars46: { '1-1': 3, '1-2': 2, '1-3': 2, '1-4': 1 } })); } });
const page = await ctx.newPage(); await page.clock.install();
await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1');
for (let i = 0; i < 100 && await page.locator('.bootArt35').count(); i++) await page.clock.runFor(100);
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
let n = 0; const shot = async () => page.screenshot({ path: `${out}/${String(n++).padStart(5, '0')}.png` });
const idle = async (frames) => { for (let i = 0; i < frames; i++) { await page.clock.runFor(33); await shot(); } };
const avg = async (lines, per = 55, still) => { for (let k = 0; k < lines; k++) { await idle(per); if (still && k === still[0]) await page.screenshot({ path: `${shots}/${still[1]}` }); await api('avgNext46'); await api('avgNext46'); } };
await idle(30);
await page.screenshot({ path: `${shots}/p0-lobby-run-entry.png` });
await api('runStart46', 20261010); await idle(60); await page.screenshot({ path: `${shots}/p0-run-map-layer1.png` });
await api('runAbandon46')?.catch?.(() => {});
await page.evaluate(() => window.__SAKURAYO_TEST__.backMenu?.()); await idle(10);
await api('launchLevel46', '1-1'); await idle(5);
await avg(15, 50, [7, 'v3-ch1-yoi-declare.png']);
await api('avgSkip46'); await idle(20);
await page.evaluate(() => window.__SAKURAYO_TEST__.backMenu?.()); await idle(5);
await api('storyPlay46', '1-4', 'post'); await idle(5);
await avg(9, 60, [2, 'v3-ch1-ema-twist.png']);
await browser.close(); console.log('frames', n);

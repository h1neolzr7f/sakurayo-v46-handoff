// 总览影片 UI 段：夜行入口 → 夜行地图 → 衣橱。界面基本静止，按真实时间截图后由 ffmpeg 以 30fps 拼接。
// Usage: node tools/record_overview_ui.mjs <frames-dir>
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const out = process.argv[2] || '/tmp/sy/ovui'; fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 4200, unlock: 5, done: [1, 2, 3, 4], tutorialDone: true, character: 'sayo' })); } });
const page = await ctx.newPage(); await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1&rig=2d');
await page.waitForFunction(() => window.__SAKURAYO_TEST__?.runState46, null, { timeout: 120000 }); await page.waitForTimeout(2500);
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
let n = 0; const hold = async (frames) => { const p = `${out}/${String(n).padStart(5, '0')}.jpg`; await page.screenshot({ path: p, type: 'jpeg', quality: 88 }); n++; for (let i = 1; i < frames; i++) fs.copyFileSync(p, `${out}/${String(n++).padStart(5, '0')}.jpg`); };
const live = async (secs) => { for (let i = 0; i < secs * 6; i++) { await hold(5); await page.waitForTimeout(160); } };
await page.click('#runBtn46'); await page.locator('#night46 .nc').first().waitFor(); await live(4);
await page.click('#night46 [data-ngo]'); await page.waitForTimeout(900); console.log('night', await page.evaluate(() => document.querySelector('#night46').className), await page.locator('.rn46').count()); await live(4);
const st = await api('runState46'); const nodes = await page.locator('.rn46.can').all();
for (const el of nodes.slice(0, 3)) { await el.click().catch(() => {}); await page.waitForTimeout(300); await live(1.2); }
await api('backMenu').catch(() => {}); await page.waitForTimeout(500);
await api('openWardrobe46'); await page.waitForTimeout(800); await live(3);
const tabs = await page.locator('[data-wdt]').all();
for (const t of tabs.slice(0, 4)) { await t.click().catch(() => {}); await page.waitForTimeout(400); await live(1.5); }
await browser.close(); console.log('frames', n, 'run', st.layer);

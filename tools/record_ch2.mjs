// 第二章剧情录像（离线 30fps）：2-1 说书开场 + 吐槽 → 2-3 老保安 → 2-4 章末反转「般若之躯，未尝化灰」。
// Usage: node tools/record_ch2.mjs <frames-dir> <shots-dir>
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const out = process.argv[2] || '/tmp/sy/ch2rec', shots = process.argv[3] || '/workspace/sakurayo-shots';
fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 3, done: [1, 2], tutorialDone: true, character: 'aya' })); } });
const page = await ctx.newPage(); await page.clock.install();
await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1');
for (let i = 0; i < 100 && await page.locator('.bootArt35').count(); i++) await page.clock.runFor(100);
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
let n = 0; const shot = async () => page.screenshot({ path: `${out}/${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 85 });
const idle = async (frames) => { for (let i = 0; i < frames; i++) { await page.clock.runFor(33); await shot(); } };
const avg = async (lines, per, still = []) => { for (let k = 0; k < lines; k++) { await idle(per); const s = still.find(x => x[0] === k); if (s) await page.screenshot({ path: `${shots}/${s[1]}` }); await api('avgNext46'); await api('avgNext46'); } };
await api('storyPlay46', '2-1', 'pre'); await idle(5);
await avg(8, 48, [[0, 'v18-ch2-epic.png'], [5, 'v18-ch2-banter.png']]);
await api('avgSkip46'); await idle(5);
await api('storyPlay46', '2-3', 'pre'); await idle(5); await avg(4, 50, [[1, 'v18-ch2-guard.png']]); await api('avgSkip46');
await api('storyPlay46', '2-4', 'post'); await idle(5); await avg(8, 52, [[2, 'v18-ch2-ashes.png']]);
await browser.close(); console.log('frames', n);

// 第三章 + 终章剧情录像（离线 30fps）：3-3 凛音坦白 412 夜 → 3-4 面具之后 → 4-4 结局（回扣序章）。
// Usage: node tools/record_ch34.mjs <frames-dir> <shots-dir>
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const out = process.argv[2] || '/tmp/sy/ch34rec', shots = process.argv[3] || '/workspace/sakurayo-shots';
fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 5, done: [1, 2, 3, 4], tutorialDone: true, character: 'aya' })); } });
const page = await ctx.newPage(); await page.clock.install();
await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1');
for (let i = 0; i < 100 && await page.locator('.bootArt35').count(); i++) await page.clock.runFor(100);
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
let n = 0; const shot = async () => page.screenshot({ path: `${out}/${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 85 });
const idle = async (frames) => { for (let i = 0; i < frames; i++) { await page.clock.runFor(33); await shot(); } };
const avg = async (lines, per, still = []) => { for (let k = 0; k < lines; k++) { await idle(per); const s = still.find(x => x[0] === k); if (s) await page.screenshot({ path: `${shots}/${s[1]}` }); await api('avgNext46'); await api('avgNext46'); } };
await api('storyPlay46', '3-3', 'post'); await idle(5); await avg(6, 44, [[3, 'v19-ch3-412.png']]); await api('avgSkip46');
await api('storyPlay46', '3-4', 'post'); await idle(5); await avg(9, 44, [[5, 'v19-ch3-reveal.png'], [6, 'v19-ch3-sakuya.png']]); await api('avgSkip46');
await api('storyPlay46', '4-4', 'post'); await idle(5); await avg(15, 44, [[0, 'v19-ch4-epic.png'], [5, 'v19-ch4-dawn.png'], [8, 'v19-ch4-313.png'], [12, 'v19-ch4-school.png']]);
await browser.close(); console.log('frames', n);

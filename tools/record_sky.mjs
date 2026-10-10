// 录制镜空节点（纵版射击）实机画面：手动步进，30fps，正常速度。
import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright';
const out = process.argv[2] || '/tmp/sy/sky'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 540, height: 960 } })).newPage();
await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' });
const api = (fn, ...a) => p.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
await p.evaluate(() => { window.__shmManual = 1; }); await api('runStart46', 77); await api('skyEnter46', true);
let n = 0, s;
for (; n < 600; n++) { s = await api('skyStep46', 1 / 30, 1 / 60); await p.screenshot({ path: `${out}/${String(n).padStart(5, '0')}.jpg`, quality: 85, type: 'jpeg', timeout: 180000 }); if (s.done) break; }
// 快进到 Boss 后再录 10 秒
for (let i = 0; i < 30 && !(s.boss && !s.boss.elite) && !s.done; i++) s = await api('skyStep46', 3);
for (let k = 0; k < 300 && !s.done; k++, n++) { s = await api('skyStep46', 1 / 30, 1 / 60); await p.screenshot({ path: `${out}/${String(n).padStart(5, '0')}.jpg`, quality: 85, type: 'jpeg', timeout: 180000 }); }
console.log('frames', n, JSON.stringify(s.boss)); await b.close();

// 录制镜空 Boss 阶段战（第 3 层镜空节点 = 完整三阶段 Boss）：正常速度 30fps。
import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright';
const out = process.argv[2] || '/tmp/sy/skyb'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 540, height: 960 } })).newPage();
await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' });
await p.evaluate(() => { window.__shmManual = 1; window.SakurayoShmup.start({ character: 'sayo', seed: 9, layer: 3, kind: 'boss', auto: true, power: 1.6, weapons: { spread: { lv: 3 }, homing: { lv: 2 } }, form: { slot: 'burst', name: '过载炮手' }, art: p => '../android-app/app/src/main/assets/game/art/' + p }); });
const st = () => p.evaluate(() => window.SakurayoShmup.current().snapshot());
const step = (sec) => p.evaluate(sec => { const S = window.SakurayoShmup; for (let t = 0; t < sec; t += 1 / 60) S.step(1 / 60); return S.current() ? S.current().snapshot() : null; }, sec);
let s = await st(); for (let i = 0; i < 80 && !s.boss; i++) s = await step(0.5);
await step(1.5); let n = 0;
for (; n < 600; n++) { s = await step(1 / 30); await p.screenshot({ path: `${out}/${String(n).padStart(5, '0')}.jpg`, quality: 85, type: 'jpeg', timeout: 180000 }); if (!s || s.done) break; if (n === 300 && s.boss && s.boss.phase < 2) s = await step(8); }
console.log('frames', n, JSON.stringify(s && s.boss)); await b.close();

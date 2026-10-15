// 录制东方式弹幕射击（镜空）：逐帧步进 30fps 截图 → ffmpeg。用法：node tools/record_stg.mjs <outdir> <character> <route> [seconds] [skipToCard]
import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright';
const out = process.argv[2] || '/tmp/sy/stg', ch = process.argv[3] || 'sayo', route = process.argv[4] || 'tech', secs = +(process.argv[5] || 30), skip = +(process.argv[6] || 0);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 540, height: 960 } })).newPage();
await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' });
await p.evaluate(([ch, route]) => { window.__shmManual = 1; window.SakurayoShmup.start({ character: ch, seed: 9, layer: 3, kind: 'boss', auto: true, skill: 0.6, route, power: 1.6, weapons: { spread: { lv: 3 }, orbit: { lv: 2 }, laser: { lv: 2 } }, art: q => '../android-app/app/src/main/assets/game/art/' + q }); }, [ch, route]);
const step = (sec) => p.evaluate(sec => { const S = window.SakurayoShmup; for (let t = 0; t < sec; t += 1 / 60) S.step(1 / 60); return S.current() ? S.current().snapshot() : null; }, sec);
let s = await step(0.1); for (let i = 0; i < 80 && !s.boss; i++) s = await step(0.5);
for (let i = 0; i < 400 && s.boss && s.boss.ci < skip; i++) s = await step(0.5);
await step(0.6);
let n = 0; for (; n < secs * 30; n++) { s = await step(1 / 30); await p.screenshot({ path: `${out}/${String(n).padStart(5, '0')}.jpg`, quality: 85, type: 'jpeg' }); if (!s || s.done) break; }
console.log('frames', n, JSON.stringify(s && s.boss), 'caps', s && s.caps); await b.close();

// 录制 KOF 式镜斗（双方 AI，30fps 逐帧）。用法：node tools/record_duel.mjs <outdir> <character> [seconds] [boss]
import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright';
const out = process.argv[2] || '/tmp/sy/duel', ch = process.argv[3] || 'sayo', secs = +(process.argv[4] || 30), boss = process.argv[5] === 'boss';
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage();
await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' });
await p.evaluate(([ch, boss]) => { window.__duelManual = 1; window.SakurayoDuel.start({ character: ch, seed: 5, layer: 2, boss, auto: true, skill: 0.85, route: 'tech', power: 1.6, weapons: { laser: { lv: 3 } }, art: q => '../android-app/app/src/main/assets/game/art/' + q }); }, [ch, boss]);
await p.waitForTimeout(1500);
let n = 0, s; for (; n < secs * 30; n++) { s = await p.evaluate(() => { const D = window.SakurayoDuel; D.step(1 / 60); D.step(1 / 60); return D.current() ? D.current().snapshot() : null; }); await p.screenshot({ path: `${out}/${String(n).padStart(5, '0')}.jpg`, quality: 85, type: 'jpeg' }); if (!s || s.done) break; }
console.log('frames', n, JSON.stringify(s)); await b.close();

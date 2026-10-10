// 镜弹 + 镜斗录像（正常速度 30fps，自动驾驶）：node tools/record_modes.mjs <frames-dir> <pin|duel>
import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright';
const out = process.argv[2] || '/tmp/sy/modes', kind = process.argv[3] || 'pin'; fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: kind === 'pin' ? { width: 540, height: 900 } : { width: 1280, height: 720 } })).newPage();
await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' });
await p.evaluate(kind => {
  window.__pinManual = 1; window.__duelManual = 1; const art = q => '../android-app/app/src/main/assets/game/art/' + q;
  const o = { character: kind === 'pin' ? 'aya' : 'rion', seed: 5, layer: 2, power: 1.3, auto: true, weapons: kind === 'pin' ? { bomb: { lv: 3 }, spread: { lv: 2 } } : { pierce: { lv: 3 } }, form: { slot: 'speed', name: kind === 'pin' ? '乱舞' : '百鬼连斩' }, art };
  window.__M = kind === 'pin' ? window.SakurayoPinball : window.SakurayoDuel; window.__M.start(o);
}, kind);
let n = 0, s;
for (; n < 720; n++) {
  s = await p.evaluate(() => { const M = window.__M, g = M.current(); if (!g) return null; if (M === window.SakurayoPinball && g.canShoot() && !g.done) M.autoTurn(g); M.step(1 / 30); return g.snapshot(); });
  await p.screenshot({ path: `${out}/${String(n).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 85, timeout: 120000 });
  if (!s || s.done) { for (let k = 0; k < 45; k++, n++) await p.screenshot({ path: `${out}/${String(n + 1).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 85 }); break; }
}
console.log('frames', n, JSON.stringify(s)); await b.close();

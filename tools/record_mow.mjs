// 割草（主战斗）录像：当前版本，正常速度 30fps（advanceTime 逐帧推进后截图）。先快进 25s 让构筑成型，再录 15s 风筝走位。
// Usage: node tools/record_mow.mjs <frames-dir> [level] [character]
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const out = process.argv[2] || '/tmp/sy/mow', id = process.argv[3] || '3-1', ch = process.argv[4] || 'aya';
fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript((ch) => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 5, done: [1, 2, 3, 4], tutorialDone: true, character: ch })), ch);
const page = await ctx.newPage(); await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
await page.evaluate((id) => { const a = window.__SAKURAYO_TEST__; a.launchLevel46(id); a.avgSkip46(); a.protectPlayer(); }, id);
const step = (ms, k) => page.evaluate(([ms, k]) => { const a = window.__SAKURAYO_TEST__; const press = (q, on) => dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { key: q }));
  if (a.avgState46()) a.avgSkip46(); const m = a.snapshot().mode; if (m === 'level') a.chooseUpgrade(0); if (m === 'event') a.chooseEvent(0); if (m === 'dialogue') a.dismissDialogue();
  const p = a.snapshot().player, ang = k / 90 * Math.PI * 2; let dx = Math.cos(ang), dy = Math.sin(ang);
  for (const e of a.snapshot().enemies || []) { const ex = p.x - e.x, ey = p.y - e.y, ed = Math.hypot(ex, ey) || 1; if (ed < 120) { dx += ex / ed * 1.5; dy += ey / ed * 1.5; } }
  press('d', dx > 0.3); press('a', dx < -0.3); press('s', dy > 0.3); press('w', dy < -0.3);
  if (p.skillCooldown <= 0) document.querySelector('#skill')?.click(); window.advanceTime(ms); return m; }, [ms, k]);
for (let k = 0; k < 100; k++) await step(250, k * 3);
let n = 0; for (let k = 0; k < 450; k++) { await step(33, k); await page.screenshot({ path: `${out}/${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88 }); }
await browser.close(); console.log('frames', n);

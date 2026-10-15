// 文字对比度巡检：各主要界面可见文字，颜色 vs 最近的不透明背景色（不含背景图），<3:1 报出。用法: node tests/contrast_audit.mjs
import { chromium } from 'playwright'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await b.newContext({ viewport: { width: 1024, height: 461 } });
await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 2400, unlock: 5, done: [1, 2, 3, 4], tutorialDone: true })));
const p = await ctx.newPage(); await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' });
const audit = () => p.evaluate(() => {
  const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; };
  const L = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const out = [];
  for (const e of document.querySelectorAll('body *')) {
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    let fg = rgb(cs.color), bg = null, n = e;
    while (n && n !== document.documentElement) { const s = getComputedStyle(n); const c = rgb(s.backgroundColor); if (s.backgroundImage.includes('gradient')) { const m = s.backgroundImage.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i); if (m) { bg = rgb(m[0]); if (bg.length < 4) bg[3] = 1; if (bg[3] > .5) break; } } if (c.length >= 3 && (c.length < 4 || c[3] > .5)) { bg = c; break; } n = n.parentElement; }
    if (!bg) continue;
    const a = L(fg), z = L(bg), ratio = (Math.max(a, z) + .05) / (Math.min(a, z) + .05);
    if (ratio < 3) out.push(ratio.toFixed(2) + ' ' + e.tagName + '.' + (e.className + '').slice(0, 30) + ' "' + e.textContent.trim().slice(0, 16) + '" fg' + cs.color + ' bg' + bg.join(','));
  }
  return out;
});
const res = {};
res.lobby = await audit();
for (const k of ['gacha', 'roster', 'shop', 'stage', 'trials', 'archive']) { await p.locator(`.homeNav46 [data-open="${k}"]`).first().click(); await p.waitForTimeout(500); res[k] = await audit(); await p.keyboard.press('Escape'); await p.evaluate(() => { window.__SAKURAYO_TEST__.backMenu(); document.querySelectorAll('.drawer').forEach(d => d.classList.add('hidden')); }); await p.waitForTimeout(200); }
for (const [k, v] of Object.entries(res)) { console.log('==', k, v.length); v.slice(0, 12).forEach(x => console.log('  ', x)); }
await b.close();

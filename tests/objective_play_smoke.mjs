import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path';
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const results = [];
const ids = (process.env.IDS||'2-1,3-2,3-3,4-1').split(',');
for (const ch of ['sayo','aya','rion']) for (const id of ids) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript((ch) => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 4, done:[1,2,3,4], tutorialDone: true, character: ch })), ch);
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
  await page.evaluate(([id,prot]) => { const a = window.__SAKURAYO_TEST__; a.launchLevel46(id); a.avgSkip46(); if (prot) a.protectPlayer(); }, [id, process.env.SAKURAYO_OBJ_STRICT !== '0']);
  let r;
  for (let i = 0; i < 2000; i++) {
    r = await page.evaluate(() => { const a = window.__SAKURAYO_TEST__, keys = {}; const press = (k, on) => dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { key: k }));
      if (a.avgState46()) { a.avgSkip46(); return null; } // 章末剧情（第二章起每关都有 post）
      const m = a.snapshot().mode; if (m === 'level') { a.chooseUpgrade(0); return null; } if (m === 'event') { a.chooseEvent(0); return null; } if (m === 'dialogue') { a.dismissDialogue(); return null; } if (m !== 'play') return { m, s: a.levelState46(), t: a.snapshot().runTime, hp: a.snapshot().player.hp };
      const s = a.levelState46(), p = a.snapshot().player; let tx = p.x, ty = p.y, keep = 0;
      if (s.zone) { tx = s.zone.x; ty = s.zone.y; } else if (s.targetsPos && s.targetsPos.length) { const t = s.targetsPos.sort((q, w) => Math.hypot(q.x - p.x, q.y - p.y) - Math.hypot(w.x - p.x, w.y - p.y))[0]; tx = t.x; ty = t.y; keep = 150; }
      let dx = tx - p.x, dy = ty - p.y; const d = Math.hypot(dx, dy); for (const e of a.snapshot().enemies||[]) { const ex=p.x-e.x, ey=p.y-e.y, ed=Math.hypot(ex,ey)||1; if (ed<110) { dx += ex/ed*260; dy += ey/ed*260; } } const go = d > keep + 25, back = keep && d < keep - 40;
      press('d', go && dx > 20 || back && dx < -20); press('a', go && dx < -20 || back && dx > 20); press('s', go && dy > 20 || back && dy < -20); press('w', go && dy < -20 || back && dy > 20);
      if (p.skillCooldown <= 0) document.querySelector('#skill')?.click();
      window.advanceTime(250); return null; });
    if (r) break;
  }
  results.push({ch,id,win:!!r.s.result?.got?.[0],t:r.s.objTime,fail:r.s.fail,died:r.hp<=0});console.log(ch, id, r.m, r.s.result?.got, 'obj time', r.s.label, 'runTime', r.t.toFixed(1), r.s.fail || '', 'hp', Math.round(r.hp));
  await ctx.close();
}
await browser.close();
if (process.env.PROTECT || process.env.SAKURAYO_OBJ_STRICT !== '0') { const bad = results.filter(q => !q.win); if (bad.length) { console.error('FAIL', JSON.stringify(bad)); process.exit(1); } console.log('PASS objective play: timed/channel nodes cleared within the limit by a movement agent for all three characters'); }

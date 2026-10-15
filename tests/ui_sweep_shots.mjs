// UI 截图巡检（横屏两种比例）：大厅、寻访、仓库、卡片详情、商店、关卡、试炼、档案、邮件。用法: node tests/ui_sweep_shots.mjs <outDir> [tag]
import { chromium } from 'playwright'; import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
const out = process.argv[2] || '/tmp/sweep'; const tag = process.argv[3] || 'now'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const errs = [];
for (const [w, h] of [[1024, 461], [1280, 576]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 2400, unlock: 5, done: [1, 2, 3, 4], tutorialDone: true, character: 'sayo', shop40: { ops: { owned: { school_shrine: 4, school_gun: 1, shop_sayo_festival: 1 }, pact: 'school_shrine', fashion: { owned: { shop_sayo_festival: 1 } } } } })));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e)));
  await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' }); await p.waitForTimeout(600);
  const shot = async (n) => { await p.waitForTimeout(450); await p.screenshot({ path: `${out}/${tag}_${w}x${h}_${n}.png` }); };
  await shot('lobby');
  for (const k of ['gacha', 'roster', 'shop', 'stage', 'trials', 'archive']) {
    const btn = p.locator(`.homeNav46 [data-open="${k}"]`);
    if (await btn.count()) { await btn.first().click(); await shot(k); if (k === 'roster') { const s = p.locator('.rosterSlot46:not(.lock)').first(); if (await s.count()) { await s.click(); await shot('roster_peek'); await p.keyboard.press('Escape'); } } await p.keyboard.press('Escape'); await p.waitForTimeout(250); await p.evaluate(() => window.__SAKURAYO_TEST__.backMenu()); }
  }
  await ctx.close();
}
await b.close(); console.log('shots in', out, 'errors', errs.length, errs.slice(0, 3).join(' | '));

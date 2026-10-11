// RESEARCH_V7 ④ 录像：夜行地图（奖励预告 / 妖气节点）+ 割草关卡场景机关（灯笼阵、鸟居）。Usage: node tools/record_level7.mjs <frames-dir>
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const out = process.argv[2] || '/tmp/sy/lv7'; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 5, done: [1, 2, 3, 4], tutorialDone: true, character: 'sayo' })));
const page = await ctx.newPage(); await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
await api('runStart46', 4242); await page.waitForTimeout(600);
let n = 0; const shot = async () => page.screenshot({ path: `${out}/${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88 });
for (let i = 0; i < 60; i++) await shot(); // 地图 2 秒
await page.evaluate(() => document.querySelector('#run46 .rn46.can')?.click()); for (let i = 0; i < 45; i++) await shot();
await page.evaluate(() => { document.querySelector('#run46')?.classList.add('hidden'); const a = window.__SAKURAYO_TEST__; a.launchLevel46('3-1'); a.avgSkip46(); a.protectPlayer(); });
await page.evaluate(() => window.advanceTime(2000));
const props = await api('props46'); const lan = props.find(p => p.kind === 'lantern'), tor = props.find(p => p.kind === 'torii');
for (const [tgt, frames] of [[lan, 150], [tor, 90]]) { if (!tgt) continue; await api('teleport46', tgt.x - 60, tgt.y);
  for (let k = 0; k < frames; k++) { await page.evaluate(([x, k]) => { const a = window.__SAKURAYO_TEST__, m = a.snapshot().mode; if (a.avgState46()) a.avgSkip46(); if (m === 'level') a.chooseUpgrade(0); if (m === 'event') a.chooseEvent(0); if (m === 'dialogue') a.dismissDialogue();
      const press = (q, on) => dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { key: q })); press('d', k < 12 || (k > 40 && k % 40 < 10)); press('a', k > 60 && k % 40 >= 20 && k % 40 < 30); window.advanceTime(33); }, [tgt.x, k]); await shot(); } }
await browser.close(); console.log('frames', n, !!lan, !!tor);

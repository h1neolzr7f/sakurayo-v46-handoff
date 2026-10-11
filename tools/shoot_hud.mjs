// 战斗 HUD + 升级弹窗截图。Usage: node tools/shoot_hud.mjs <outdir>
import { chromium } from 'playwright'; import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 4, tutorialDone: true })));
const p = await ctx.newPage(); await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' });
const run = (fn, ...a) => p.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn]?.(...a), [fn, a]);
await run('selectCharacter', 'sayo'); await run('selectStage', 1); await run('start'); await run('dismissDialogue'); await run('protectPlayer'); await p.waitForTimeout(4000);
await p.screenshot({ path: `${out}/13_hud.png` }); await run('forceLevelUp'); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/14_levelup.png` }); await b.close();

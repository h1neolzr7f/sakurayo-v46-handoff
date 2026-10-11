// 打磨轮：各界面截图（前后对比用）。Usage: node tools/shoot_ui.mjs <outdir>
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const out = process.argv[2] || '/tmp/sy/ui'; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 2400, unlock: 5, done: [1, 2, 3, 4], tutorialDone: true, character: 'sayo' })));
const p = await ctx.newPage(); const url = pathToFileURL(path.resolve('src/index.html')).href + '?test=1';
await p.goto(url); await p.waitForTimeout(250); await p.screenshot({ path: `${out}/00_loading.png` });
await p.locator('.bootArt35').waitFor({ state: 'detached' }); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/01_lobby.png` });
const api = (fn, ...a) => p.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn]?.(...a), [fn, a]).catch(() => null);
let i = 2; for (const k of ['stage', 'talent', 'story', 'ach', 'shop', 'gacha', 'roster']) { const el = p.locator(`[data-open="${k}"]`).first(); if (await el.count()) { await el.click({ force: true }).catch(() => {}); await p.waitForTimeout(700); await p.screenshot({ path: `${out}/${String(i++).padStart(2, '0')}_${k}.png` }); await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelectorAll('.drawer:not(.hidden) .close, .drawer:not(.hidden) [data-close]').forEach(x => x.click())); await p.waitForTimeout(300); } }
await api('openWardrobe46'); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/${String(i++).padStart(2, '0')}_wardrobe.png` }); await api('backMenu'); await p.goto(url); await p.locator('.bootArt35').waitFor({ state: 'detached' });
await api('openNight46'); await p.waitForTimeout(700); await p.screenshot({ path: `${out}/${String(i++).padStart(2, '0')}_night.png` });
await api('runStart46', 4242); await p.waitForTimeout(700); await p.screenshot({ path: `${out}/${String(i++).padStart(2, '0')}_runmap.png` });
await p.goto(url); await p.locator('.bootArt35').waitFor({ state: 'detached' }); await api('openPachi46', { seed: 3 }); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/${String(i++).padStart(2, '0')}_shateki.png` });
await b.close(); console.log(fs.readdirSync(out).join(' '));

// 打磨轮录像：大厅点击 → 面板转场 → 关闭 → 射的中奖弹窗。Usage: node tools/record_ui_polish.mjs <outdir> [repoRoot]
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const out = process.argv[2], root = process.argv[3] || '.'; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } } });
await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 2400, unlock: 5, done: [1, 2, 3, 4], tutorialDone: true, character: 'sayo' })));
const p = await ctx.newPage(); await p.goto(pathToFileURL(path.resolve(root, 'src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' }); await p.waitForTimeout(800);
await p.mouse.move(300, 300); for (let i = 0; i < 20; i++) { await p.mouse.move(300 + i * 30, 300 + Math.sin(i / 3) * 80); await p.waitForTimeout(40); }
for (const k of ['shop', 'gacha']) { const el = p.locator(`[data-open="${k}"]`).first(); const bb = await el.boundingBox(); if (bb) { await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); } await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelectorAll('.drawer:not(.hidden) .close, .drawer:not(.hidden) [data-close]').forEach(x => x.click())); await p.waitForTimeout(600); }
await p.evaluate(() => window.__SAKURAYO_TEST__.openPachi46({ seed: 11 })); await p.waitForTimeout(700);
for (let i = 0; i < 4; i++) { await p.evaluate(() => window.__SAKURAYO_TEST__.pachiFire46()); await p.waitForTimeout(1300); }
await p.evaluate(() => window.SakurayoPolish?.reward({ icon: '🐱', title: '招财猫（🌸 200 · 镜屑 1）', rarity: 'SSR', rarityLabel: '大奖', desc: '庙会射的' })); await p.waitForTimeout(2200);
await ctx.close(); await b.close(); const f = fs.readdirSync(out).find(x => x.endsWith('.webm')); console.log(path.join(out, f));

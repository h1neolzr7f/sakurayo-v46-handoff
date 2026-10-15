import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path';
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 4, tutorialDone: true })));
const page = await ctx.newPage();
await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
await page.evaluate(() => { const a = window.__SAKURAYO_TEST__; a.selectCharacter('sayo'); a.selectStage(2); a.start(); a.dismissDialogue(); a.protectPlayer();
  for (const [w, n] of [['spread', 3], ['homing', 3], ['orbit', 5], ['bomb', 2], ['ricochet', 2], ['laser', 4]]) a.giveWeapon46(w, n); window.advanceTime(20000); });
for (let f = 0; f < 450; f++) {
  await page.evaluate((f) => { const a = window.__SAKURAYO_TEST__, keys = ['d', 's', 'a', 'w'];
    if (f % 60 === 0) { for (const q of 'wasd') dispatchEvent(new KeyboardEvent('keyup', { key: q })); dispatchEvent(new KeyboardEvent('keydown', { key: keys[(f / 60) % 4 | 0] })); }
    for (let i = 0; i < 4; i++) { const m = a.snapshot().mode; if (m === 'level') a.chooseUpgrade(0); else if (m === 'dialogue') a.dismissDialogue(); else if (m === 'event') a.chooseEvent(0); }
    window.advanceTime(1000 / 30); }, f);
  await page.screenshot({ path: `/tmp/sy/rec/${String(f).padStart(4, '0')}.png` });
}
await browser.close();

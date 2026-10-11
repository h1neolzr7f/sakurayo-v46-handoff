// 录制缘日射的（庙会抽奖）与 Boss 三选一面板。
import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright';
const out = process.argv[2] || '/tmp/sy/pachi'; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, recordVideo: { dir: out, size: { width: 844, height: 390 } } }); const p = await ctx.newPage();
await p.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1'); await p.locator('.bootArt35').waitFor({ state: 'detached' });
const api = (fn, ...a) => p.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
await api('runRoute46', 'bio'); await api('runStart46', 777); await api('skyEnter46', true, 'boss'); await p.waitForTimeout(3000);
await api('runRoute46', 'tech'); await api('runStart46', 778); await api('skyEnter46', true, 'boss'); await p.waitForTimeout(3000);
await p.evaluate(() => { document.querySelector('#run46')?.classList.add('hidden'); });
await api('openPachi46', { seed: 5 }); await p.waitForTimeout(800);
for (let i = 0; i < 5; i++) { await p.waitForTimeout(1600); await api('pachiFire46'); } await p.waitForTimeout(2500);
await ctx.close(); await b.close();
const f = fs.readdirSync(out).find(x => x.endsWith('.webm')); console.log(path.join(out, f));

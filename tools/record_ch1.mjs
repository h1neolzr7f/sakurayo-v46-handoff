// Offline 30 fps capture of a chapter-1 slice: level map → AVG (typewriter, portraits) → 1-3 escort combat → CG → stars.
// Usage: node tools/record_ch1.mjs <outdir-for-png-frames>
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import fs from 'node:fs';
const out = process.argv[2] || '/tmp/sy/ch1rec'; fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 1, tutorialDone: true, character: 'sayo', stars46: { '1-1': 3, '1-2': 2 } })); } });
const page = await ctx.newPage(); await page.clock.install();
await page.goto(pathToFileURL(path.resolve('src/index.html')).href + '?test=1');
for (let i = 0; i < 100 && await page.locator('.bootArt35').count(); i++) await page.clock.runFor(100);
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
let n = 0; const shot = async () => page.screenshot({ path: `${out}/${String(n++).padStart(5, '0')}.png` });
const idle = async (frames, game) => { for (let i = 0; i < frames; i++) { await page.clock.runFor(33); if (game) await page.evaluate(game); await shot(); } };
await idle(10);
await page.click('#levelMapBtn46'); await idle(20);
await page.click('.lm46Node >> nth=2'); await idle(30);
await page.click('.lm46Sheet .go'); await idle(5);
for (let k = 0; k < 5; k++) { await idle(k ? 40 : 30); await api('avgNext46'); await api('avgNext46'); }
await api('avgSkip46'); await api('protectPlayer');
const step = `(()=>{const a=window.__SAKURAYO_TEST__;const m=a.snapshot().mode;if(m==='level')a.chooseUpgrade(0);else if(m==='event')a.chooseEvent(0);else if(m==='dialogue')a.dismissDialogue();else if(m==='play'){const s=a.levelState46();if(s.npc){const p=a.snapshot().player;const tx=s.npc.x+60,ty=s.npc.y+8;for(const q of 'wasd')dispatchEvent(new KeyboardEvent('keyup',{key:q}));if(Math.abs(tx-p.x)>30)dispatchEvent(new KeyboardEvent('keydown',{key:tx>p.x?'d':'a'}));if(Math.abs(ty-p.y)>30)dispatchEvent(new KeyboardEvent('keydown',{key:ty>p.y?'s':'w'}));}window.advanceTime(1000/30);}})()`;
await idle(330, step);
// fast-forward the rest of the escort off-camera, then capture the CG + result
for (let i = 0; i < 4000; i++) { const m = await page.evaluate(`(()=>{${step.slice(6,-4)};return window.__SAKURAYO_TEST__.snapshot().mode})()`); if (m === 'avg' || m === 'result') break; }
await idle(75);
await api('avgNext46'); await idle(45);
await api('avgSkip46'); await idle(50);
await browser.close(); console.log('frames', n);

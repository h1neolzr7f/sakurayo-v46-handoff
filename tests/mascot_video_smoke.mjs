// 视频看板娘入口：有 clips 清单时播循环 idle，点击切到片段，播完回到 idle；没有清单时回退 rig。
import { chromium } from 'playwright'; import { pathToFileURL } from 'node:url'; import path from 'node:path'; import assert from 'node:assert/strict';
const entry = process.argv[2] || 'src/index.html';
const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, ...(process.env.REC ? { recordVideo: { dir: process.env.REC, size: { width: 1280, height: 720 } } } : {}) });
await ctx.addInitScript(() => { localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 2, done: [1], tutorialDone: true, character: 'aya' }));
  window.SakurayoMascotVideoClips = { aya: { dir: '_demo', idle: ['idle.webm', 'idle.mp4'], taps: { any: [['tap.webm', 'tap.mp4']] } } }; });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(pathToFileURL(path.resolve(entry)).href + '?test=1');
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
await page.waitForFunction(() => { const s = window.__SAKURAYO_TEST__?.mascotVideo46?.(); return s && s.clip === 'idle' && s.playing.some(Boolean); }, null, { timeout: 60000 });
assert.ok(await page.locator('#heroLive46.vid46 .heroVid46 video.on').count() === 1, 'one visible video');
assert.equal(await page.locator('#heroLive46 canvas.heroRig46').count(), 0, 'rig not mounted when video exists');
const f = await api('mascotVideoTap46', 'head'); assert.ok(f === 'tap.webm' || f === 'tap.mp4');
await page.waitForFunction(() => window.__SAKURAYO_TEST__.mascotVideo46().clip.startsWith('tap:'), null, { timeout: 20000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__.mascotVideo46().clip === 'idle', null, { timeout: 20000 }); // 片段播完回 idle
assert.deepEqual(errs, []);
if (process.env.REC) { await api('mascotVideoTap46', 'body'); await page.waitForTimeout(4000); }
await page.screenshot({ path: process.env.SHOT || 'tests/artifacts/mascot_video.png' }).catch(() => {});
await ctx.close(); await b.close(); console.log('PASS mascot video: clips manifest → looping idle, tap clip, back to idle; rig skipped');

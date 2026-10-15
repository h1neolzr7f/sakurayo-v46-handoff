import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';
import http from 'node:http';
import fs from 'node:fs';
const target = process.argv[2] || 'src/index.html';
// http so WebAudio can fetch/decode the OGG loops (file:// falls back to <audio>, covered at the end)
const root = path.resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.ogg': 'audio/ogg', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); res.end(d); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const rel = path.relative(root, path.resolve(target)).split(path.sep).join('/');
const url = `http://127.0.0.1:${server.address().port}/${rel}?test=1`;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
await ctx.addInitScript(() => { if (!localStorage.getItem('sakurayoV3')) localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 5000, unlock: 3, done: [1, 2], tutorialDone: true, settings: { master: .8, music: .5 } })); });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(url); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const st = () => page.evaluate(() => window.SakurayoBGM.state());
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
const until = async (pred, label) => { for (let i = 0; i < 60; i++) { const s = await st(); if (pred(s)) return s; await page.waitForTimeout(100); } assert.fail(label + ' ' + JSON.stringify(await st())); };
await page.mouse.click(420, 60); // first gesture starts audio
let s = await until(x => x.scene === 'lobby' && x.voices.includes('lobby'), 'lobby loop');
assert.equal(s.backend, 'webaudio', JSON.stringify(s));
assert.ok(Math.abs(s.vol - 0.4) < 1e-6, 'volume follows master*music');
await page.locator('#menu .homeNav46 [data-open=gacha]').click();
await until(x => x.scene === 'gacha' && x.voices.join() === 'gacha', 'gacha crossfade');
await page.keyboard.press('Escape');
await until(x => x.scene === 'lobby', 'back to lobby');
await api('start'); await api('dismissDialogue');
await page.evaluate(() => window.advanceTime(50));
await until(x => x.scene === 'battle', 'battle');
await api('spawnBossNow'); for (let i = 0; i < 10; i++) await page.evaluate(() => window.advanceTime(100));
await until(x => x.scene === 'boss', 'boss');
await api('finish', true);
await until(x => x.sting && x.voices.includes('sting:win') && x.scene === null, 'win sting');
// mute: music stops
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('sakurayoV3')); return s; });
const gain = await page.evaluate(async () => { const b = await (await fetch(window.artUrl('bgm/boss.ogg'))).arrayBuffer(); const c = new OfflineAudioContext(2, 44100, 44100); const buf = await c.decodeAudioData(b); return { dur: buf.duration, ch: buf.numberOfChannels }; });
assert.ok(gain.dur > 30 && gain.ch === 2, 'boss loop decodes: ' + JSON.stringify(gain));
assert.equal(errors.length, 0, errors.join('\n'));
await browser.close(); server.close();
console.log('PASS bgm smoke: webaudio lobby/gacha/battle/boss crossfades, win sting, volume = master*music');

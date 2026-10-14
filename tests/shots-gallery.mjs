/**
 * 截取动画预览画廊，确认所有视频都能加载。
 * 用法: node shots-gallery.mjs
 */

import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = 'http://127.0.0.1:8899/preview/animation-gallery.html';
const OUT = 'E:\\deepseek工作区\\game-lab\\shots';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 1400 } });

const bad = [];
page.on('response', (r) => {
  if (r.status() >= 400) bad.push(`${r.status()} ${r.url().split('/').pop()}`);
});
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(6000);

// 检查每个 video 的实际加载状态
const stats = await page.evaluate(() =>
  [...document.querySelectorAll('video')].map((v) => ({
    src: v.src.split('/').slice(-2).join('/'),
    readyState: v.readyState,
    w: v.videoWidth,
    h: v.videoHeight,
    paused: v.paused,
    err: v.error ? v.error.code : null,
  }))
);

console.log(`共 ${stats.length} 个视频:`);
for (const s of stats) {
  const ok = s.readyState >= 2 && !s.err && s.w > 0;
  console.log(
    `  ${ok ? 'OK  ' : 'FAIL'} ${s.src.padEnd(30)} ${s.w}x${s.h} ready=${s.readyState} ${s.paused ? 'paused' : 'playing'}${s.err ? ' err=' + s.err : ''}`
  );
}
if (bad.length) console.log('异常响应:', bad.slice(0, 8));

const badCount = stats.filter((s) => !(s.readyState >= 2 && !s.err && s.w > 0)).length;
console.log(`\n结论: ${stats.length - badCount}/${stats.length} 个视频可播放`);

fs.mkdirSync(OUT, { recursive: true });
const shot = `${OUT}\\gallery-full-${Date.now()}.png`;
await page.screenshot({ path: shot, fullPage: true });
console.log(`截图: ${shot}`);

// 再截一张首屏（用于快速查看）
const shot2 = `${OUT}\\gallery-top-${Date.now()}.png`;
await page.screenshot({ path: shot2 });
console.log(`首屏: ${shot2}`);

await browser.close();

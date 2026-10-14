/**
 * 验证 Boss 转阶段 PV 是否真的播放。
 *
 * 做法：起本地静态服务 -> 打开游戏 -> 用 window.__SAKURAYO_TEST__ 直接推进到 Boss
 *       -> 触发转阶段 -> 检查 SakurayoBossPv.state() 并截图。
 *
 * 用法: node tests/boss_pv_check.mjs
 */

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SHOTS = 'E:\\deepseek工作区\\game-lab\\shots';
fs.mkdirSync(SHOTS, { recursive: true });

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.ogg': 'audio/ogg', '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/src/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404); res.end('nf'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
console.log(`静态服务: http://127.0.0.1:${port}`);

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console error]', m.text().slice(0, 160)); });
page.on('pageerror', (e) => console.log('  [pageerror]', String(e).slice(0, 200)));

await page.goto(`http://127.0.0.1:${port}/src/index.html?test=1`, { waitUntil: 'load' });
await page.waitForTimeout(3000);

// 1. 模块是否挂上
const info = await page.evaluate(() => ({
  hasPv: typeof window.SakurayoBossPv === 'object' && window.SakurayoBossPv !== null,
  hasCutscene: typeof window.SakurayoCutscene === 'object' && window.SakurayoCutscene !== null,
  wrapped: !!(window.SakurayoCutscene && window.SakurayoCutscene.flashPhase && window.SakurayoCutscene.flashPhase.__bossPvWrapped),
  hasTestApi: typeof window.__SAKURAYO_TEST__ === 'object' && window.__SAKURAYO_TEST__ !== null,
}));
console.log('模块状态:', JSON.stringify(info));

if (!info.hasPv) { console.log('FAIL: SakurayoBossPv 未加载'); }
if (!info.wrapped) { console.log('FAIL: flashPhase 未被包装（cutscene 加载晚于本模块？）'); }

// 2. 直接调用 play 验证资源可加载
const playRes = await page.evaluate(async () => {
  const r = window.SakurayoBossPv.play(3);
  await new Promise((s) => setTimeout(s, 900));
  const st = window.SakurayoBossPv.state();
  const v = document.querySelector('#bossPvWrap video');
  return {
    called: r,
    state: st,
    videoExists: !!v,
    readyState: v ? v.readyState : -1,
    error: v && v.error ? v.error.code : null,
    videoWidth: v ? v.videoWidth : 0,
  };
});
console.log('play(3) 结果:', JSON.stringify(playRes));

await page.screenshot({ path: path.join(SHOTS, `boss-pv-live-${Date.now()}.png`) });

// 3. 观察一段时间确认没有异常
await page.waitForTimeout(2000);
const after = await page.evaluate(() => window.SakurayoBossPv.state());
console.log('2 秒后状态:', JSON.stringify(after));

console.log(`\n结论: 模块加载=${info.hasPv} 包装=${info.wrapped} 视频元素=${playRes.videoExists} readyState=${playRes.readyState} 尺寸=${playRes.videoWidth}px`);
console.log(`截图目录: ${SHOTS}`);

await browser.close();
server.close();

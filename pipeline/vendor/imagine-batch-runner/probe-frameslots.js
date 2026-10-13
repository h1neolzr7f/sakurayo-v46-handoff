/**
 * 探测 Grok 上传图片后的「帧槽位」（首帧/中间帧/尾帧）。
 *
 * 之前的误判说明：只抓 aria-label 会漏掉图形化的槽位。
 * 这里改为：上传图 -> 把输入区完整 DOM 结构 dump 出来（含 class/位置/可点区域）-> 逐个点击试探。
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILE = path.join(HERE, 'profiles', 'main-chrome');
const SHOTS = 'E:\\deepseek工作区\\game-lab\\shots';
const FRAME = 'C:\\Users\\tzzcomputer\\Desktop\\看板娘首帧\\sayo_frame.jpg';

fs.mkdirSync(SHOTS, { recursive: true });

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const args = [
  '--disable-blink-features=AutomationControlled',
  '--excludeSwitches=enable-automation',
  '--disable-infobars',
  '--profile-directory=Default',
];
if (proxyUrl) args.push(`--proxy-server=${proxyUrl}`);

const ctx = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome', headless: false,
  viewport: { width: 1400, height: 1000 }, args, acceptDownloads: true,
});
const page = ctx.pages()[0] || (await ctx.newPage());
page.setDefaultTimeout(30000);

const clear = () => page.evaluate(() => {
  document.querySelectorAll('[data-cookie-banner="true"],div[role="dialog"][aria-label="隐私偏好中心"]').forEach((e) => e.remove());
}).catch(() => {});

const shot = async (tag) => {
  const p = path.join(SHOTS, `slots-${tag}-${Date.now()}.png`);
  await page.screenshot({ path: p }).catch(() => {});
  console.log(`  截图 -> ${path.basename(p)}`);
};

await page.goto('https://grok.com/imagine', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await clear();

// 上传
console.log('上传首帧 ...');
await page.locator('button[aria-label="上传"], button[aria-label="Upload"]').first().click({ timeout: 20000 }).catch(() => {});
const fi = page.locator('input[type=file]').first();
await fi.waitFor({ state: 'attached', timeout: 20000 });
await fi.setInputFiles(FRAME);
await page.waitForTimeout(9000);
await clear();
await shot('01-uploaded');

// 切到视频模式（帧槽位通常在视频模式才完整）
console.log('切到视频模式 ...');
await page.getByRole('button', { name: '视频', exact: true }).first().click({ timeout: 8000 }).catch((e) => console.log('  点视频:', e.message.slice(0, 60)));
await page.waitForTimeout(2500);
await clear();
await shot('02-video-mode');

// dump 输入区结构
const dump = await page.evaluate(() => {
  const ed = document.querySelector('[contenteditable="true"]');
  if (!ed) return { err: 'no editor' };
  let box = ed;
  for (let i = 0; i < 8 && box.parentElement; i++) box = box.parentElement;

  const items = [];
  for (const el of box.querySelectorAll('button,[role="button"],[role="radio"],svg,div[class*="cursor"]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) continue;
    items.push({
      tag: el.tagName.toLowerCase(),
      aria: el.getAttribute('aria-label') || '',
      title: el.getAttribute('title') || '',
      ph: el.getAttribute('placeholder') || '',
      dataAttrs: [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `${a.name}=${a.value}`).join(' '),
      cls: (el.className || '').toString().split(' ').filter((c) => c && !c.startsWith('css-')).slice(0, 5).join(' '),
      rect: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
      text: (el.innerText || '').trim().slice(0, 24),
    });
  }
  // 也把输入区整段 HTML 抓出来（截断）
  return { count: items.length, items, html: box.outerHTML.slice(0, 3000) };
});

if (dump.err) {
  console.log('探测失败:', dump.err);
} else {
  console.log(`\n=== 输入区 ${dump.count} 个可交互元素 ===`);
  for (const it of dump.items) {
    console.log(`  [${it.tag}] aria="${it.aria}" title="${it.title}" ${it.dataAttrs} | ${it.rect} | "${it.text}" | ${it.cls}`);
  }
  console.log('\n=== 输入区 HTML（前 3000 字符）===');
  console.log(dump.html);
}

await ctx.close();

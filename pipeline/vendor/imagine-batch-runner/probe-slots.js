/**
 * 实测 Grok 网页 UI 的「帧槽位」操作方式。
 *
 * 目标：搞清 [图片] > [摄像机+] > [摄像机] 这组槽位各自是什么，
 * 以及点了「摄像机+」之后出现什么（推测是「加中间帧/尾帧」）。
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
const args = ['--disable-blink-features=AutomationControlled', '--excludeSwitches=enable-automation', '--disable-infobars', '--profile-directory=Default'];
if (proxyUrl) args.push(`--proxy-server=${proxyUrl}`);

const ctx = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome', headless: false, viewport: { width: 1400, height: 1000 }, args, acceptDownloads: true,
});
const page = ctx.pages()[0] || (await ctx.newPage());
page.setDefaultTimeout(30000);

const clear = () => page.evaluate(() => {
  document.querySelectorAll('[data-cookie-banner="true"],div[role="dialog"][aria-label="隐私偏好中心"]').forEach((e) => e.remove());
}).catch(() => {});
const shot = async (t) => { const p = path.join(SHOTS, `slot-${t}-${Date.now()}.png`); await page.screenshot({ path: p }).catch(() => {}); console.log(`  shot -> ${path.basename(p)}`); };

await page.goto('https://grok.com/imagine', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await clear();

// 上传首帧
console.log('1) 上传首帧 ...');
await page.locator('button[aria-label="上传"]').first().click({ timeout: 20000 }).catch(() => {});
const fi = page.locator('input[type=file]').first();
await fi.waitFor({ state: 'attached', timeout: 20000 });
await fi.setInputFiles(FRAME);
await page.waitForTimeout(9000);
await clear();
await shot('01-uploaded');

// 找到那组槽位：小尺寸、靠左、在输入框上方一排
const slots = await page.evaluate(() => {
  const out = [];
  // 缩略图通常带 "选择图像" 的 aria，以及一些方形小按钮
  for (const b of document.querySelectorAll('button,[role="button"],div[role="button"]')) {
    const r = b.getBoundingClientRect();
    if (r.width < 20 || r.width > 160 || r.height < 20 || r.height > 160) continue;
    if (r.y > window.innerHeight * 0.95) continue;
    out.push({
      aria: b.getAttribute('aria-label') || '',
      title: b.getAttribute('title') || '',
      text: (b.innerText || '').trim().slice(0, 20),
      svg: !!b.querySelector('svg'),
      img: !!b.querySelector('img'),
      cls: (b.className || '').toString().slice(0, 70),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    });
  }
  return out;
});
console.log(`\n2) 找到 ${slots.length} 个候选槽位元素:`);
for (const s of slots) {
  console.log(`  aria="${s.aria}" title="${s.title}" text="${s.text}" svg=${s.svg} img=${s.img} @${s.rect.x},${s.rect.y} ${s.rect.w}x${s.rect.h}`);
  console.log(`     cls=${s.cls}`);
}

// 点击那个「摄像机+」—— 特征：带 svg、尺寸小、在图片缩略图右边
console.log('\n3) 尝试点击「摄像机+」槽位 ...');
const plusSlot = page.locator('button:has(svg)').filter({ hasNotText: /\S/ }).first();
// 更精确：用坐标点击 find 到的第一个 svg 小按钮
const target = slots.find((s) => s.svg && !s.img && s.rect.w < 70);
if (target) {
  console.log(`  点击坐标 (${target.rect.x + target.rect.w / 2}, ${target.rect.y + target.rect.h / 2})`);
  await page.mouse.click(target.rect.x + target.rect.w / 2, target.rect.y + target.rect.h / 2);
  await page.waitForTimeout(3000);
  await clear();
  await shot('02-after-click');

  // 看出现了什么新东西
  const after = await page.evaluate(() => ({
    dialogs: [...document.querySelectorAll('[role="dialog"],[role="menu"],[role="listbox"]')].map((d) => ({
      aria: d.getAttribute('aria-label') || '', text: (d.innerText || '').trim().slice(0, 200),
    })),
    fileInputs: document.querySelectorAll('input[type=file]').length,
    menuItems: [...document.querySelectorAll('[role="menuitem"],[role="option"]')].map((m) => (m.innerText || '').trim().slice(0, 40)).filter(Boolean),
  }));
  console.log('\n4) 点击后:', JSON.stringify(after, null, 1));
} else {
  console.log('  没找到符合条件的槽位');
}

await ctx.close();

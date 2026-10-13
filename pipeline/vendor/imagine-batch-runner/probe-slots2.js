/**
 * 定位 Grok 的帧槽位（首帧/中间帧/尾帧）。
 *
 * 已知：
 *  - 上传图后不会立刻出现
 *  - 用户提示「它在生成上传里面」——工具箱有 生成/上传/音频/参考/画图 五项
 *  - 用户截图里槽位形态：[图片缩略图] > [摄像机+] > [摄像机]
 *
 * 策略：关掉遮挡弹窗 -> 逐个点工具箱条目，每点一次截图并 dump 槽位区 DOM，找到含多张图/多相机图标的那一栏。
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
page.setDefaultTimeout(20000);

const clear = () => page.evaluate(() => {
  document.querySelectorAll('[data-cookie-banner="true"],div[role="dialog"][aria-label="隐私偏好中心"]').forEach((e) => e.remove());
}).catch(() => {});

const closePopups = async () => {
  // 关掉 "Your Bots are in Grok" 这类营销弹窗
  for (const label of ['关闭', 'Close', '走吧', '知道了', 'Got it']) {
    const b = page.getByRole('button', { name: label, exact: false }).first();
    if (await b.isVisible().catch(() => false)) {
      await b.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(600);
    }
  }
  // 兜底：直接移除遮罩层
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"]').forEach((d) => {
      const r = d.getBoundingClientRect();
      if (r.width > 300 && r.width < 700) d.remove();
    });
  }).catch(() => {});
};

const shot = async (t) => { const p = path.join(SHOTS, `slots2-${t}-${Date.now()}.png`); await page.screenshot({ path: p }).catch(() => {}); console.log(`  shot -> ${path.basename(p)}`); };

/** 找槽位区：输入框上方那一排小方块（缩略图 + 相机图标） */
const findSlots = () => page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('button,[role="button"],div[class*="aspect-square"]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 26 || r.width > 110) continue;
    if (r.height < 26 || r.height > 110) continue;
    if (r.y < 20 || r.y > 420) continue; // 只看上方区域
    out.push({
      aria: el.getAttribute('aria-label') || '',
      title: el.getAttribute('title') || '',
      img: !!el.querySelector('img'),
      svg: !!el.querySelector('svg'),
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      cls: (el.className || '').toString().slice(0, 60),
    });
  }
  return out;
});

try {
  await page.goto('https://grok.com/imagine', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  await clear(); await closePopups();
  await shot('00-clean');

  console.log('1) 上传首帧 ...');
  await page.locator('button[aria-label="上传"]').first().click({ timeout: 20000 }).catch(() => {});
  const fi = page.locator('input[type=file]').first();
  await fi.waitFor({ state: 'attached', timeout: 20000 });
  await fi.setInputFiles(FRAME);
  await page.waitForTimeout(9000);
  await clear(); await closePopups();
  await shot('01-uploaded');

  console.log('  槽位:', JSON.stringify(await findSlots()));

  // 依次点工具箱条目
  for (const label of ['生成', '上传', '参考']) {
    console.log(`\n2) 点击工具箱「${label}」...`);
    const b = page.getByRole('button', { name: label, exact: true }).first();
    if (!(await b.isVisible().catch(() => false))) { console.log('   不可见，跳过'); continue; }
    await b.click({ timeout: 8000 }).catch((e) => console.log('   点击失败:', e.message.slice(0, 50)));
    await page.waitForTimeout(2500);
    await clear(); await closePopups();
    await shot(`02-after-${label}`);

    const s = await findSlots();
    console.log(`   槽位 ${s.length} 个:`);
    for (const x of s) console.log(`     aria="${x.aria}" title="${x.title}" img=${x.img} svg=${x.svg} @${x.x},${x.y} ${x.w}x${x.h}`);
    if (s.length > 1) console.log('   >>> 出现多个槽位，可能命中');
  }
} catch (e) {
  console.log('异常:', e.message);
  await shot('err');
} finally {
  await ctx.close();
}

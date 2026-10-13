/**
 * 点开「制作视频」下拉，列出所有菜单项，并截图。
 * 用法: node probe-menu.js [permalink]
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILE = path.join(HERE, 'profiles', 'main-chrome');
const SHOTS = 'E:\\deepseek工作区\\game-lab\\shots';
const url = process.argv[2] || 'https://grok.com/imagine';

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const launchArgs = [
  '--disable-blink-features=AutomationControlled',
  '--excludeSwitches=enable-automation',
  '--disable-infobars',
  '--profile-directory=Default',
];
if (proxyUrl) launchArgs.push(`--proxy-server=${proxyUrl}`);

fs.mkdirSync(SHOTS, { recursive: true });

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1400, height: 1000 },
  args: launchArgs,
});
const page = context.pages()[0] || (await context.newPage());
page.setDefaultTimeout(20000);

const clearOverlays = async () => {
  await page
    .evaluate(() => {
      document
        .querySelectorAll('[data-cookie-banner="true"], div[role="dialog"][aria-label="隐私偏好中心"]')
        .forEach((el) => el.remove());
    })
    .catch(() => {});
};

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
await clearOverlays();

const shot = async (tag) => {
  const p = path.join(SHOTS, `menu-${tag}-${Date.now()}.png`);
  await page.screenshot({ path: p }).catch(() => {});
  console.log(`截图 -> ${path.basename(p)}`);
};

await shot('before');

// 点「制作视频」
const mk = page.getByRole('button', { name: '制作视频', exact: false }).first();
const visible = await mk.isVisible().catch(() => false);
console.log(`「制作视频」可见: ${visible}`);
if (visible) {
  const box = await mk.boundingBox();
  console.log(`  位置: ${JSON.stringify(box)}`);
  await mk.click({ timeout: 15000 }).catch((e) => console.log(`  点击失败: ${e.message}`));
  await page.waitForTimeout(3000);
  await clearOverlays();
  await shot('after-click-mk');

  // 列出新出现的菜单项 / 选项
  const items = await page.evaluate(() => {
    const out = [];
    const sels = ['[role="menuitem"]', '[role="option"]', '[role="radio"]', '[role="tab"]', 'li'];
    for (const s of sels) {
      for (const el of document.querySelectorAll(s)) {
        const r = el.getBoundingClientRect();
        if (r.width < 10 || r.height < 8) continue;
        const t = (el.innerText || '').trim().slice(0, 30);
        if (!t) continue;
        out.push({ sel: s, text: t, aria: el.getAttribute('aria-label') || '', checked: el.getAttribute('aria-checked') });
      }
    }
    // 去重
    const seen = new Set();
    return out.filter((x) => {
      const k = x.text;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });
  console.log('\n=== 展开后的菜单项 / 选项 ===');
  for (const it of items) console.log(`  [${it.sel}] "${it.text}" aria="${it.aria}" checked=${it.checked}`);

  // 列出当前 composer 区域按钮（看提交按钮是否从 disabled 变成可用）
  const composer = await page.evaluate(() => {
    const ed = document.querySelector('[contenteditable="true"]');
    if (!ed) return { err: 'no editor' };
    let box = ed;
    for (let i = 0; i < 6 && box.parentElement; i++) box = box.parentElement;
    return [...box.querySelectorAll('button,[role="button"]')].map((b) => {
      const r = b.getBoundingClientRect();
      return {
        aria: b.getAttribute('aria-label') || '',
        text: (b.innerText || '').trim().slice(0, 16),
        disabled: b.disabled === true,
        x: Math.round(r.x),
        y: Math.round(r.y),
      };
    });
  });
  console.log('\n=== 展开后 composer 按钮 ===');
  console.log(JSON.stringify(composer, null, 1));
}

await context.close();

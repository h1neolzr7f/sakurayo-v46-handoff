/**
 * 探测 Grok Imagine 输入区所有按钮的真实属性，用来定位"提交/生成"按钮。
 * 用法: node probe-buttons.js [permalink]
 */

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILE = path.join(HERE, 'profiles', 'main-chrome');
const url = process.argv[2] || 'https://grok.com/imagine';

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const launchArgs = [
  '--disable-blink-features=AutomationControlled',
  '--excludeSwitches=enable-automation',
  '--disable-infobars',
  '--profile-directory=Default',
];
if (proxyUrl) launchArgs.push(`--proxy-server=${proxyUrl}`);

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1400, height: 1000 },
  args: launchArgs,
});

const page = context.pages()[0] || (await context.newPage());
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
await page
  .evaluate(() => {
    document
      .querySelectorAll('[data-cookie-banner="true"], div[role="dialog"][aria-label="隐私偏好中心"]')
      .forEach((el) => el.remove());
  })
  .catch(() => {});

const info = await page.evaluate(() => {
  const out = [];
  for (const b of document.querySelectorAll('button, [role="button"]')) {
    const r = b.getBoundingClientRect();
    const cs = getComputedStyle(b);
    if (r.width < 8 || r.height < 8) continue;
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    out.push({
      aria: b.getAttribute('aria-label') || '',
      title: b.getAttribute('title') || '',
      text: (b.innerText || '').trim().slice(0, 24),
      type: b.getAttribute('type') || '',
      disabled: b.disabled === true,
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      inForm: !!b.closest('form'),
      svg: !!b.querySelector('svg'),
      cls: (b.className || '').toString().slice(0, 60),
    });
  }
  return out;
});

console.log(`共 ${info.length} 个可见按钮：\n`);
for (const b of info) {
  const label = [b.aria && `aria="${b.aria}"`, b.title && `title="${b.title}"`, b.text && `text="${b.text}"`]
    .filter(Boolean)
    .join(' ');
  console.log(
    `  ${label || '(无标签)'}\n    type=${b.type || '-'} disabled=${b.disabled} form=${b.inForm} svg=${b.svg} ` +
      `rect=(${b.x},${b.y},${b.w}x${b.h})\n    cls=${b.cls}\n`
  );
}

// 特别标出位于画面右下角、带 svg 的候选提交按钮
const candidates = info
  .filter((b) => b.svg && b.y > 600 && b.x > 700 && !b.disabled)
  .sort((a, b) => b.y - a.y || b.x - a.x);
console.log('=== 右下角带 svg 的候选（疑似提交按钮）===');
for (const c of candidates.slice(0, 6)) {
  console.log(
    `  aria="${c.aria}" text="${c.text}" type=${c.type} rect=(${c.x},${c.y},${c.w}x${c.h}) cls=${c.cls}`
  );
}

// 以输入框为中心，列出它周围的按钮（提交按钮通常紧贴输入框右下角）
const near = await page.evaluate(() => {
  const ed = document.querySelector('[contenteditable="true"]');
  if (!ed) return { err: 'no contenteditable' };
  const er = ed.getBoundingClientRect();
  // 往上找一个容器，覆盖输入框所在的整个 composer 区域
  let box = ed;
  for (let i = 0; i < 6 && box.parentElement; i++) box = box.parentElement;
  const br = box.getBoundingClientRect();
  const out = [];
  for (const b of box.querySelectorAll('button, [role="button"]')) {
    const r = b.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    out.push({
      aria: b.getAttribute('aria-label') || '',
      text: (b.innerText || '').trim().slice(0, 20),
      type: b.getAttribute('type') || '',
      disabled: b.disabled === true,
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      svg: !!b.querySelector('svg'),
    });
  }
  return { editorRect: { x: Math.round(er.x), y: Math.round(er.y), w: Math.round(er.width), h: Math.round(er.height) },
           boxRect: { x: Math.round(br.x), y: Math.round(br.y), w: Math.round(br.width), h: Math.round(br.height) },
           buttons: out };
});
console.log('\n=== composer 区域（输入框所在容器）内的按钮 ===');
if (near.err) console.log('  ' + near.err);
else {
  console.log(`  输入框 rect=${JSON.stringify(near.editorRect)}`);
  console.log(`  容器   rect=${JSON.stringify(near.boxRect)}`);
  for (const b of near.buttons) {
    console.log(
      `  aria="${b.aria}" text="${b.text}" type=${b.type} disabled=${b.disabled} svg=${b.svg} rect=(${b.x},${b.y},${b.w}x${b.h})`
    );
  }
}

await context.close();

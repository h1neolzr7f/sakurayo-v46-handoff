/**
 * 用三张已经钉好的静帧生成一段视频。
 * 首帧和末帧是同一张原图，中间帧只抬了一点枪。
 * 帧角色菜单是 hover 才出现的。
 *
 * 用法: node make-keyed-video.js <首帧> <中间帧> <末帧> <输出名>
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILE = path.join(HERE, 'profiles', 'main-chrome');
const SHOTS = 'E:\\deepseek工作区\\game-lab\\shots';
const OUTDIR = path.join(HERE, 'downloads', 'mascot');

const frames = process.argv.slice(2, 5);
const outName = process.argv[5] || 'sayo-rifle-keyed';
const promptText =
  process.argv[6] ||
  'Locked: her face, hair, outfit, feet, and the night background. Moving: the rifle tilts a little upward until it matches the middle frame, then returns exactly to the first frame. Both gloved hands stay closed around the one rifle and never let go. No waving, no extra fingers, no second rifle. Fixed camera. Background stays completely static.';

if (frames.length !== 3 || frames.some((p) => !fs.existsSync(p))) {
  console.error('用法: node make-keyed-video.js <首帧> <中间帧> <末帧> <输出名>');
  process.exit(1);
}

const ROLES = ['首帧', '中间帧', '末帧'];
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:7897';
const launchArgs = [
  '--disable-blink-features=AutomationControlled',
  '--excludeSwitches=enable-automation',
  '--disable-infobars',
  '--profile-directory=Default',
  `--proxy-server=${proxyUrl}`,
];

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1440, height: 1000 },
  args: launchArgs,
  acceptDownloads: true,
});

const page = context.pages()[0] || (await context.newPage());
page.setDefaultTimeout(30000);

const clearOverlays = async () => {
  await page.evaluate(() => {
    document
      .querySelectorAll(
        '[data-cookie-banner="true"], div[role="dialog"][aria-label="Cookie notice"], div[role="dialog"][aria-label="隐私偏好中心"]'
      )
      .forEach((el) => el.remove());
  }).catch(() => {});
  for (const label of ['走吧', '关闭', 'Close', '知道了']) {
    const b = page.getByRole('button', { name: label, exact: true }).first();
    if (await b.isVisible().catch(() => false)) {
      await b.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
  }
};

const shot = async (tag) => {
  const p = path.join(SHOTS, `${outName}-${tag}-${Date.now()}.png`);
  await page.screenshot({ path: p }).catch(() => {});
  log(`截图 -> ${path.basename(p)}`);
  return p;
};

const listButtons = async () => {
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('button,[role="button"],[role="menuitem"]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > innerHeight) continue;
      const text = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 24);
      if (!text) continue;
      out.push(`${text}@${Math.round(r.x)},${Math.round(r.y)}`);
    }
    return out.slice(0, 40);
  });
};

const thumbs = async () => {
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('img,button')) {
      const r = el.getBoundingClientRect();
      if (r.width < 36 || r.width > 160 || r.height < 36 || r.height > 180) continue;
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (!img) continue;
      out.push({
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        alt: img.alt || '',
      });
    }
    out.sort((a, b) => a.x - b.x || a.y - b.y);
    const uniq = [];
    for (const t of out) {
      if (uniq.some((u) => Math.abs(u.x - t.x) < 8 && Math.abs(u.y - t.y) < 8)) continue;
      uniq.push(t);
    }
    return uniq;
  });
};

const uploadVia = async (fileList) => {
  const input = page.locator('input[type=file]').last();
  await input.waitFor({ state: 'attached', timeout: 15000 });
  await input.setInputFiles(fileList);
};

try {
  log('打开 grok.com/imagine');
  await page.goto('https://grok.com/imagine', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await clearOverlays();
  await shot('00-open');
  log('按钮', (await listButtons()).join(' | '));

  log('上传三帧 ...');
  const plus = page.locator('button[aria-label="上传"], button[aria-label="Upload"], button[aria-label="添加"], button:has-text("+")').first();
  if (await plus.isVisible().catch(() => false)) {
    await plus.click({ timeout: 8000 }).catch((e) => log('点上传', e.message.split('\n')[0]));
  }
  await uploadVia(frames);
  await page.waitForTimeout(8000);
  await clearOverlays();
  await shot('01-uploaded');
  let cells = await thumbs();
  log(`缩略图 ${cells.length}`, JSON.stringify(cells));

  if (cells.length < 3) {
    log('一次没挂上三张，改为逐张上传');
    for (const file of frames) {
      const add = page.locator('button[aria-label="上传"], button[aria-label="Upload"]').first();
      if (await add.isVisible().catch(() => false)) await add.click({ timeout: 5000 }).catch(() => {});
      await uploadVia(file);
      await page.waitForTimeout(4000);
    }
    await shot('01b-uploaded');
    cells = await thumbs();
    log(`逐张后缩略图 ${cells.length}`, JSON.stringify(cells));
  }

  // 上传面板会盖住帧角色菜单。先关掉，再去 hover 缩略图。
  await page.keyboard.press('Escape').catch(() => {});
  await page.mouse.move(8, 8);
  await page.waitForTimeout(600);

  const composerThumbs = () => thumbs().then((list) => list.filter((c) => c.y < 520 && c.h < 80));

  for (let i = 0; i < 3; i++) {
    const role = ROLES[i];
    const fresh = (await composerThumbs()).filter(
      (c, idx, arr) => arr.findIndex((o) => Math.abs(o.x - c.x) < 24) === idx
    );
    log('当前格子', JSON.stringify(fresh));
    const c = fresh[i];
    if (!c) {
      log(`没有第 ${i} 张缩略图`, JSON.stringify(fresh));
      break;
    }
    log(`hover 第 ${i} 张 @${c.x},${c.y} 目标 ${role}`);
    await page.mouse.move(c.x + c.w / 2, c.y + c.h / 2);
    await page.waitForTimeout(800);
    await shot(`02-hover-${i}`);
    const text = page.getByText(role, { exact: true }).first();
    if (!(await text.isVisible().catch(() => false))) {
      await page.keyboard.press('Escape').catch(() => {});
      await page.mouse.move(8, 8);
      await page.waitForTimeout(400);
      await page.mouse.move(c.x + c.w / 2, c.y + c.h / 2);
      await page.waitForTimeout(900);
    }
    if (await text.isVisible().catch(() => false)) {
      const clicked = await text.click({ timeout: 4000 }).then(() => true).catch((e) => {
        log(`第 ${i} 张点「${role}」失败`, e.message.split('\n')[0]);
        return false;
      });
      if (clicked) log(`第 ${i} 张设为 ${role}`);
    } else {
      log(`第 ${i} 张没有「${role}」`);
    }
    await page.mouse.move(8, 8);
    await page.waitForTimeout(500);
  }
  await shot('03-roles');

  log('填提示词');
  const editor = page.locator('[contenteditable="true"]').last();
  if (await editor.isVisible().catch(() => false)) {
    await editor.click({ timeout: 8000 }).catch(() => {});
    await editor.fill(promptText);
  } else {
    log('没有输入框');
  }
  await page.waitForTimeout(1500);
  await shot('04-prompt');

  log('提交');
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
  const submit = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('button,[role="button"]')];
    const auto = nodes.find((b) => (b.innerText || '').includes('自动模式'));
    if (!auto) return null;
    const ra = auto.getBoundingClientRect();
    const cand = nodes
      .map((b) => ({ b, r: b.getBoundingClientRect() }))
      .filter(({ r }) => r.x > ra.x + ra.width - 8 && r.width >= 24 && r.width <= 72 && r.height >= 24 && Math.abs(r.y - ra.y) < 30);
    cand.sort((a, b) => a.r.x - b.r.x);
    const hit = cand[0];
    if (!hit) return null;
    return {
      aria: hit.b.getAttribute('aria-label') || hit.b.innerText || '',
      x: hit.r.x + hit.r.width / 2,
      y: hit.r.y + hit.r.height / 2,
    };
  });
  const send = page.getByRole('button', { name: '提交', exact: true }).last();
  if (await send.isVisible().catch(() => false)) {
    await send.click({ timeout: 8000 });
    log('已点击「提交」');
  } else if (submit) {
    log(`坐标点击 aria="${submit.aria}" @${Math.round(submit.x)},${Math.round(submit.y)}`);
    await page.mouse.click(submit.x, submit.y);
  } else {
    log('没找到提交按钮');
  }
  await page.waitForTimeout(2500);
  await shot('05-submitted');

  log('等待生成，最长 10 分钟');
  const deadline = Date.now() + 10 * 60 * 1000;
  let videoUrl = null;
  while (Date.now() < deadline) {
    await page.waitForTimeout(6000);
    await clearOverlays();
    const st = await page.evaluate(() => {
      const vids = [...document.querySelectorAll('video')];
      const ready = vids.find((v) => (v.currentSrc || v.src || '').length > 0 && v.readyState >= 2);
      const nodes = [...document.querySelectorAll('span.tabular-nums')].map((n) => n.textContent.trim());
      const pct = nodes.find((t) => t.endsWith('%')) || null;
      return { hasReadyVideo: !!ready, pct, all: nodes.slice(0, 3), url: location.href };
    });
    if (st.pct) log(`生成中 ${st.pct}`);
    else if (st.hasReadyVideo && /\/post\//.test(st.url)) {
      log('检测到可播放视频');
      videoUrl = st.url;
      break;
    }
  }
  await shot('06-done');
  log(`结果页面: ${videoUrl || page.url()}`);

  const src = await page.evaluate(() => {
    const m = location.pathname.match(/\/post\/([0-9a-f-]{36})/i);
    const pageUuid = m ? m[1] : null;
    const vids = [...document.querySelectorAll('video')];
    if (pageUuid) {
      for (const v of vids) {
        const s = v.currentSrc || v.src || '';
        if (s && s.includes(pageUuid)) return { s, how: 'uuid-match' };
      }
    }
    for (const v of [...vids].reverse()) {
      const s = v.currentSrc || v.src || '';
      if (s && !s.startsWith('blob:')) return { s, how: 'last-nonblob' };
    }
    return { s: null, how: 'none' };
  });

  if (src.s) {
    log(`video src (${src.how})`);
    const savePath = path.join(OUTDIR, `${outName}.mp4`);
    const cookies = await context.cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    log(`取得 ${cookies.length} 条 cookie`);
    const args = ['-sS', '-L', '--max-time', '180', '-A', 'Mozilla/5.0', '--proxy', proxyUrl];
    if (cookieStr) args.push('-H', `Cookie: ${cookieStr}`);
    args.push('-o', savePath, src.s);
    try {
      execFileSync('curl.exe', args, { stdio: 'pipe' });
    } catch (e) {
      log('curl 失败', (e.stderr?.toString() || e.message).split('\n')[0]);
    }
    const size = fs.existsSync(savePath) ? fs.statSync(savePath).size : 0;
    log(size > 10000 ? `已保存 ${savePath} (${(size / 1024 / 1024).toFixed(2)} MB)` : `文件过小 ${size}`);
  } else {
    log('页面上没有匹配的 video');
  }
} catch (err) {
  console.error(`失败: ${err.message}`);
  await shot('error');
} finally {
  await context.close().catch(() => {});
}

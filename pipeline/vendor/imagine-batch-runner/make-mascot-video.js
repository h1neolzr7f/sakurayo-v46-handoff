/**
 * 看板娘视频生成器（全自动，一步到位）
 *
 * 用途：把一张 2:3 竖构图首帧变成可循环的待机动画，供 docs/MASCOT_VIDEO.md 的规格使用。
 *
 * 为什么单独写而不是直接用 imagine-batch-runner：
 *   run start 是「在已有视频帖子上生成变体」的工作流。而看板娘要的是
 *   「上传一张静态图 -> 制作视频 -> 生成待机动画」，第一步必须自己上传，
 *   且上传后的帖子停在**编辑模式**，页面上的第一个可点按钮是「编辑」不是「生成视频」，
 *   直接跑 run start 会点到「编辑」并误判成功（实测 target button aria="编辑"）。
 *
 * 流程：上传 -> 点「制作视频」切到视频模式 -> 填提示词 -> 点「生成视频」-> 等完成 -> 下载
 *
 * 用法: node make-mascot-video.js <首帧图> <输出名> [提示词]
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILE = path.join(HERE, 'profiles', 'main-chrome');
const SHOTS = 'E:\\deepseek工作区\\game-lab\\shots';
const OUTDIR = path.join(HERE, 'downloads', 'mascot');

const imgPath = process.argv[2];
const outName = process.argv[3] || 'mascot';
const promptText =
  process.argv[4] ||
  'subtle idle breathing animation, gentle chest rise and fall, soft hair and cloth sway, one slow blink, fixed camera, no camera movement, background stays static';

if (!imgPath || !fs.existsSync(imgPath)) {
  console.error('用法: node make-mascot-video.js <首帧图> <输出名> [提示词]');
  process.exit(1);
}

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const launchArgs = [
  '--disable-blink-features=AutomationControlled',
  '--excludeSwitches=enable-automation',
  '--disable-infobars',
  '--profile-directory=Default',
];
if (proxyUrl) launchArgs.push(`--proxy-server=${proxyUrl}`);

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(OUTDIR, { recursive: true });

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1400, height: 1000 },
  args: launchArgs,
  acceptDownloads: true,
});

const page = context.pages()[0] || (await context.newPage());
page.setDefaultTimeout(30000);

/** 清掉 Cookie 横幅等遮挡层（Grok 的 cookie banner z-index 是 2147483647） */
const clearOverlays = async () => {
  await page
    .evaluate(() => {
      document
        .querySelectorAll(
          '[data-cookie-banner="true"], div[role="dialog"][aria-label="Cookie notice"], div[role="dialog"][aria-label="隐私偏好中心"]'
        )
        .forEach((el) => el.remove());
    })
    .catch(() => {});
};

const shot = async (tag) => {
  const p = path.join(SHOTS, `${outName}-${tag}-${Date.now()}.png`);
  await page.screenshot({ path: p }).catch(() => {});
  log(`截图 -> ${path.basename(p)}`);
  return p;
};

/** 按可见文案点按钮（Grok 中文界面） */
const clickByText = async (labels, tag) => {
  for (const label of labels) {
    const loc = page.getByRole('button', { name: label, exact: false }).first();
    if (await loc.isVisible().catch(() => false)) {
      await loc.click({ timeout: 15000 }).catch(() => {});
      log(`点击「${label}」(${tag})`);
      return true;
    }
  }
  log(`未找到按钮: ${labels.join(' / ')} (${tag})`);
  return false;
};

try {
  log('打开 grok.com/imagine');
  await page.goto('https://grok.com/imagine', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await clearOverlays();

  // ---- 1. 上传首帧 ----
  log('上传首帧 ...');
  await page
    .locator('button[aria-label="上传"], button[aria-label="Upload"]')
    .first()
    .click({ timeout: 20000 })
    .catch((e) => log(`  点上传按钮: ${e.message}`));
  const fileInput = page.locator('input[type=file]').first();
  await fileInput.waitFor({ state: 'attached', timeout: 20000 });
  await fileInput.setInputFiles(imgPath);
  log('文件已提交，等图片就绪 ...');
  await page.waitForTimeout(9000);
  await clearOverlays();
  await shot('01-uploaded');

  // ---- 2. 切到视频模式 ----
  // 上传后落在「编辑图片」视图，composer 里那个按钮是 aria="编辑" 且 disabled，
  // 必须点右侧「制作视频」展开菜单，里面才是真正的入口：
  //   Add Prompt / Quick Animate / Loop
  // 「Loop」专做循环动画，正是看板娘 idle 需要的（首尾相接）。
  log('点开「制作视频」菜单 ...');
  const mkBtn = page.getByRole('button', { name: '制作视频', exact: false }).first();
  let menuOpen = false;
  // 图片上传后页面还要一会儿才渲染出右侧面板的工具按钮，必须显式等待，
  // 否则会出现"同一秒就去找按钮、当然找不到"的假失败。
  try {
    await mkBtn.waitFor({ state: 'visible', timeout: 60000 });
  } catch {
    log('  等待 60s 仍未出现「制作视频」按钮');
  }
  if (await mkBtn.isVisible().catch(() => false)) {
    await mkBtn.click({ timeout: 15000 }).catch((e) => log(`  点击失败: ${e.message}`));
    await page.waitForTimeout(2500);
    await clearOverlays();
    await shot('02-menu-open');
    menuOpen = true;
    log('  菜单已展开');
  } else {
    log('  未找到「制作视频」按钮');
  }

  // ---- 3. 选「Loop」（或退而求其次 Quick Animate）----
  log('选择视频生成方式 ...');
  let mode = null;
  if (menuOpen) {
    for (const name of ['Loop', '循环', 'Quick Animate']) {
      const item = page.getByRole('menuitem', { name, exact: false }).first();
      if (await item.isVisible().catch(() => false)) {
        await item.click({ timeout: 15000 }).catch((e) => log(`  点「${name}」失败: ${e.message}`));
        mode = name;
        log(`  已选「${name}」`);
        break;
      }
    }
  }
  if (!mode) log('  未找到菜单项（Loop / Quick Animate）');
  await page.waitForTimeout(4000);
  await clearOverlays();
  await shot('03-mode-chosen');

  // ---- 4. 填提示词（如果 composer 又可用）----
  log('填入提示词 ...');
  const editor = page.locator('[contenteditable="true"]').first();
  if (await editor.isVisible().catch(() => false)) {
    await editor.click({ timeout: 10000 }).catch(() => {});
    await editor.fill(promptText);
    log(`  已填入 ${promptText.length} 字符`);
  } else {
    log('  未找到输入框');
  }
  await page.waitForTimeout(2500);
  await clearOverlays();
  await shot('04-prompt-filled');

  // ---- 5. 点提交（composer 内那个按钮，aria 会随状态变化）----
  log('提交生成 ...');
  const submit = await page.evaluate(() => {
    const ed = document.querySelector('[contenteditable="true"]');
    if (!ed) return null;
    let box = ed;
    for (let i = 0; i < 6 && box.parentElement; i++) box = box.parentElement;
    const btns = [...box.querySelectorAll('button,[role="button"]')].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width >= 8 && r.height >= 8 && !b.disabled;
    });
    // 取最靠右下角的那个
    btns.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return rb.y + rb.x - (ra.y + ra.x);
    });
    if (!btns[0]) return null;
    const r = btns[0].getBoundingClientRect();
    return { aria: btns[0].getAttribute('aria-label') || '', x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (submit) {
    log(`  提交按钮 aria="${submit.aria}" 坐标=(${Math.round(submit.x)},${Math.round(submit.y)})`);
    await page.mouse.click(submit.x, submit.y);
    log('  已点击提交');
  } else {
    log('  未找到可用的提交按钮（可能菜单选择已直接触发生成）');
  }
  await shot('05-submitted');

  // ---- 5. 等生成完成 ----
  log('等待生成（最长 10 分钟）...');
  const deadline = Date.now() + 10 * 60 * 1000;
  let videoUrl = null;
  while (Date.now() < deadline) {
    await page.waitForTimeout(6000);
    await clearOverlays();

    const st = await page.evaluate(() => {
      const vids = [...document.querySelectorAll('video')];
      const ready = vids.find((v) => (v.currentSrc || v.src || '').length > 0 && v.readyState >= 2);
      // 注意：这个选择器在生成阶段显示百分比（"16%"），在播放阶段显示时间（"0:04 / 0:06"）。
      // 只有带 % 的才算"正在生成"，否则会把播放进度误判成生成进度而永远等下去。
      const nodes = [...document.querySelectorAll('span.tabular-nums')].map((n) => n.textContent.trim());
      const pct = nodes.find((t) => t.endsWith('%')) || null;
      return { hasReadyVideo: !!ready, pct, all: nodes.slice(0, 3) };
    });

    if (st.pct) log(`  生成中 ${st.pct}`);
    else if (st.hasReadyVideo) {
      log(`检测到可播放视频，生成完成${st.all.length ? ' (' + st.all.join(' ') + ')' : ''}`);
      videoUrl = page.url();
      break;
    }
  }
  await clearOverlays();
  await shot('04-done');
  log(`结果页面: ${videoUrl || page.url()}`);

  // ---- 6. 下载 ----
  // 不依赖 Playwright 的 download 事件（实测会在 context 关闭时才落地，导致
  // "download.saveAs: Target page, context or browser has been closed"）。
  // 直接从页面里取出 video 的真实地址，用 request 抓字节，时序完全可控。
  log('下载视频 ...');
  // 页面里会残留历史视频元素（侧栏缩略图预览等），直接取第一个 video 会拿到**上一个**视频。
  // 必须按当前页面的 post UUID 精确匹配，匹配不到再退化为"取最后一个非 blob 的 src"。
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
    log(`  video src (${src.how}): ${src.s.split('?')[0].slice(0, 100)}`);
    const savePath = path.join(OUTDIR, `${outName}.mp4`);
    let downloaded = false;

    // assets.grok.com 需要登录 cookie（否则返回空/403），所以从浏览器 context 取凭据。
    // 凭据只写进临时清单文件供 curl 使用，绝不打印。
    let cookieStr = '';
    try {
      const cookies = await context.cookies();
      cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
      log(`  取得 ${cookies.length} 条 cookie（不打印内容）`);
    } catch (e) {
      log(`  读取 cookie 失败: ${e.message.split('\n')[0]}`);
    }

    // 方案 A：curl + 代理 + cookie（最可靠）
    try {
      const { execFileSync } = await import('node:child_process');
      const args = ['-sS', '-L', '--max-time', '180', '-A', 'Mozilla/5.0'];
      if (proxyUrl) args.push('--proxy', proxyUrl);
      if (cookieStr) args.push('-H', `Cookie: ${cookieStr}`);
      args.push('-o', savePath, src.s);
      execFileSync('curl.exe', args, { stdio: 'pipe' });
      const size = fs.existsSync(savePath) ? fs.statSync(savePath).size : 0;
      if (size > 10000) {
        log(`已保存(curl) -> ${savePath} (${(size / 1024 / 1024).toFixed(2)} MB)`);
        downloaded = true;
      } else {
        log(`  curl 返回文件过小: ${size} 字节`);
      }
    } catch (e) {
      log(`  curl 失败: ${(e.stderr?.toString() || e.message).split('\n')[0]}`);
    }

    // 方案 B：带代理的独立 APIRequestContext（继承浏览器 cookie）
    if (!downloaded) {
      try {
        const { request } = await import('playwright');
        const api = await request.newContext({
          proxy: proxyUrl ? { server: proxyUrl } : undefined,
          storageState: await context.storageState(),
          ignoreHTTPSErrors: true,
        });
        const resp = await api.get(src.s, { timeout: 180000 });
        if (resp.ok()) {
          const buf = await resp.body();
          fs.writeFileSync(savePath, buf);
          if (buf.length > 10000) {
            log(`已保存(api) -> ${savePath} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
            downloaded = true;
          } else {
            log(`  api 返回过小: ${buf.length} 字节`);
          }
        } else {
          log(`  api HTTP ${resp.status()}`);
        }
        await api.dispose();
      } catch (e) {
        log(`  api 方式失败: ${e.message.split('\n')[0]}`);
      }
    }

    // 方案 C：页面内 fetch（浏览器自己带 cookie 和代理）
    if (!downloaded) {
      try {
        const b64 = await page.evaluate(async (u) => {
          const r = await fetch(u);
          if (!r.ok) return `ERR:${r.status}`;
          const buf = new Uint8Array(await r.arrayBuffer());
          let s = '';
          const CH = 0x8000;
          for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode.apply(null, buf.subarray(i, i + CH));
          return btoa(s);
        }, src.s);
        if (b64.startsWith('ERR:')) {
          log(`  page fetch HTTP ${b64}`);
        } else {
          const buf = Buffer.from(b64, 'base64');
          fs.writeFileSync(savePath, buf);
          log(`已保存(page fetch) -> ${savePath} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
          downloaded = true;
        }
      } catch (e) {
        log(`  page fetch 失败: ${e.message.split('\n')[0]}`);
      }
    }

    if (!downloaded) log('  三种抓取方式都失败');
  } else {
    log('  页面上没有 video 元素');
  }

  // 兜底：再试一次页面上的下载按钮（若 request 方式没拿到）
  if (!fs.existsSync(path.join(OUTDIR, `${outName}.mp4`))) {
    log('  回退到下载按钮 ...');
    const dlBtn = page
      .locator('button[aria-label*="下载"], button[aria-label*="Download"], button:has-text("下载")')
      .first();
    if (await dlBtn.isVisible().catch(() => false)) {
      const dl = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
      await dlBtn.click({ timeout: 15000 }).catch(() => {});
      const download = await dl;
      if (download) {
        const savePath = path.join(OUTDIR, `${outName}${path.extname(download.suggestedFilename()) || '.mp4'}`);
        await download.saveAs(savePath).catch((e) => log(`  saveAs 失败: ${e.message}`));
        log(`  下载按钮方式 -> ${savePath}`);
      } else {
        log('  未捕获下载事件');
      }
    } else {
      log('  没有可见的下载按钮');
    }
  }

  log(`完成。permalink: ${page.url()}`);
} catch (err) {
  console.error(`失败: ${err.message}`);
  await shot('error');
} finally {
  await context.close().catch(() => {});
}

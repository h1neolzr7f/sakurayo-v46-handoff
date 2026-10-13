/**
 * 用 Playwright 把首帧图上传到 Grok Imagine，拿到 post permalink。
 *
 * 为什么不用 bsk：Grok 的「上传」走 showOpenFilePicker()，bsk upload 是
 * 「点击 target 触发 file chooser」的模式，对非 input 型 picker 无效。
 * Playwright 的 setInputFiles 走 CDP 直接把文件塞进 input，
 * 不要求元素可见、也不依赖 chooser 事件。
 *
 * 复用 imagine-batch-runner 已登录的 profile，所以不需要重新登录。
 *
 * 用法: node upload-frame.js <图片路径> [--keep-open]
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILE = path.join(HERE, 'profiles', 'main-chrome');

const imgPath = process.argv[2];
if (!imgPath || !fs.existsSync(imgPath)) {
  console.error('用法: node upload-frame.js <图片路径> [--keep-open]');
  process.exit(1);
}
const keepOpen = process.argv.includes('--keep-open');

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

const launchArgs = [
  '--disable-blink-features=AutomationControlled',
  '--excludeSwitches=enable-automation',
  '--disable-infobars',
  '--profile-directory=Default',
];
if (proxyUrl) launchArgs.push(`--proxy-server=${proxyUrl}`);

console.log(`profile: ${PROFILE}`);
console.log(`代理: ${proxyUrl || '(无)'}`);
console.log(`图片: ${imgPath}`);

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1280, height: 960 },
  args: launchArgs,
  acceptDownloads: true,
});

const page = context.pages()[0] || (await context.newPage());

// 顺手清掉 Cookie 横幅，避免挡住后续操作
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

try {
  console.log('打开 grok.com/imagine ...');
  await page.goto('https://grok.com/imagine', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await clearOverlays();

  // 上传按钮 + 隐藏 file input
  console.log('点击上传按钮，等待 file input 就绪 ...');
  const uploadBtn = page.locator('button[aria-label="上传"], button[aria-label="Upload"]').first();
  await uploadBtn.click({ timeout: 20000 }).catch((e) => console.log(`  点击上传按钮: ${e.message}`));

  // Grok 会在点击后挂上隐藏的 input[type=file]
  const fileInput = page.locator('input[type=file]').first();
  await fileInput.waitFor({ state: 'attached', timeout: 20000 });
  console.log('file input 已就绪，塞入文件 ...');

  await fileInput.setInputFiles(imgPath);
  console.log('文件已提交，等待上传完成 ...');

  // 等图片真正被接受：出现缩略图、或 URL 进入 post 页
  await page.waitForTimeout(8000);
  await clearOverlays();

  const url = page.url();
  const state = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter((i) => i.src && i.src.startsWith('blob:'));
    const text = document.body.innerText.slice(0, 300);
    return { blobImgs: imgs.length, hasGenerating: /生成中|Generating/i.test(text) };
  });

  console.log(`\n当前 URL: ${url}`);
  console.log(`页面内 blob 图片数: ${state.blobImgs}`);

  // 截图存档，便于人工确认
  const shotDir = 'E:\\deepseek工作区\\game-lab\\shots';
  fs.mkdirSync(shotDir, { recursive: true });
  const shot = path.join(shotDir, `upload-${Date.now()}.png`);
  await page.screenshot({ path: shot });
  console.log(`截图: ${shot}`);

  if (keepOpen) {
    console.log('\n--keep-open 已指定，浏览器保持打开。完成后手动关闭。');
    await page.waitForTimeout(600000);
  }
} catch (err) {
  console.error(`失败: ${err.message}`);
  const shotDir = 'E:\\deepseek工作区\\game-lab\\shots';
  fs.mkdirSync(shotDir, { recursive: true });
  await page.screenshot({ path: path.join(shotDir, `upload-fail-${Date.now()}.png`) }).catch(() => {});
} finally {
  if (!keepOpen) await context.close();
}

// 横屏锁定：竖屏只显示旋转提示，提示期间挡住输入、暂停时钟；转回横屏后恢复。
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
const entry = process.argv[2] || process.env.SAKURAYO_ENTRY || "src/index.html";
const url = pathToFileURL(path.resolve(entry)).href + "?test=1";
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true })));
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => window.SakurayoRotate && window.SakurayoPlatform);
  const s1 = await page.evaluate(() => {
    const e = document.getElementById("syRotate");
    return { on: e.classList.contains("on"), display: getComputedStyle(e).display, blocked: window.__syRotateBlocked, top: !!document.elementFromPoint(195, 422)?.closest("#syRotate"), text: e.textContent };
  });
  assert.equal(s1.on, true, "竖屏应显示旋转提示");
  assert.notEqual(s1.display, "none");
  assert.equal(s1.blocked, true);
  assert.equal(s1.top, true, "旋转提示必须盖在最上层、挡住点击");
  assert.match(s1.text, /请横屏游玩/);

  // 横屏下开局，再转成竖屏：时钟暂停，转回后恢复
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.getElementById("syRotate").classList.contains("on")), false, "横屏不显示旋转提示");
  await page.evaluate(() => { const t = window.__SAKURAYO_TEST__; t.selectStage(1); t.start(); t.dismissDialogue(); });
  assert.equal(await page.evaluate(() => window.__SAKURAYO_TEST__.snapshot().mode), "play");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const paused = await page.evaluate(() => window.__SAKURAYO_TEST__.snapshot().mode);
  assert.notEqual(paused, "play", "竖屏旋转提示期间战斗必须暂停");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.__syRotateBlocked), false);
  assert.deepEqual(errors, []);
  console.log("PASS rotate smoke: portrait shows rotate prompt on top, blocks input, pauses play; landscape clears it");
} finally { await browser.close(); }

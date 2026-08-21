import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "tests/artifacts/layout47");
fs.mkdirSync(out, { recursive: true });
const url = `${pathToFileURL(path.join(root, "src/index.html")).href}?test=1`;

const api = (page, method, ...args) =>
  page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });

const boxOf = (page, sel) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      hidden: el.classList.contains("hidden") || s.display === "none",
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      right: Math.round(r.right),
      bottom: Math.round(r.bottom),
    };
  }, sel);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 932, height: 430 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
await page.waitForTimeout(600);

await api(page, "selectCharacter", "sayo");
const faces = await boxOf(page, ".charSelectPanel");
const status = await boxOf(page, ".homeStatus47");
assert.ok(faces && faces.y > 220, `三角色圆头不得挡脸，实际 y=${faces?.y}`);
assert.ok(status && status.right < 200, `左上状态不得压脸，right=${status?.right}`);
await api(page, "openDrawer", "shop");
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "shop.png") });
const shop = await boxOf(page, "#shopDrawer");
const buy = await boxOf(page, "#shopDrawer .skinCard button, #shopDrawer .shopItem40 button");
assert.ok(shop && !shop.hidden, "商店抽屉打开");
assert.ok(shop.x > 400, `商店应在右半屏，实际 x=${shop.x}`);
assert.ok(shop.w <= 500, `商店不应铺满，实际 w=${shop.w}`);
assert.ok(buy && buy.bottom <= 430 && buy.y >= 0, `购买按钮必须在屏内 y=${buy?.y} bottom=${buy?.bottom}`);

await page.evaluate(() => document.getElementById("shopDrawer")?.classList.add("hidden"));
await api(page, "openDrawer", "gacha");
await page.waitForTimeout(280);
const wishHero = await boxOf(page, ".wishHero46");
const wishPity = await boxOf(page, ".wishPity46");
const wishDock = await boxOf(page, ".wishDock46");
const wishTabs = await boxOf(page, ".wishTabs46");
const wishTitle = await boxOf(page, ".wishTitle46");
assert.ok(wishHero && wishHero.w >= 430 && wishHero.h >= 400, `寻访立绘应铺满左半屏，w=${wishHero?.w} h=${wishHero?.h}`);
const wishFit = await page.evaluate(() => getComputedStyle(document.querySelector(".wishHero46")).objectFit);
assert.equal(wishFit, "cover", "寻访站桩上半截是空的，必须 cover 裁掉头顶空白");
assert.ok(wishTabs && wishTabs.x > 600, `页签应在右上，x=${wishTabs?.x}`);
assert.ok(wishTitle && wishTitle.y >= 48 && wishTitle.x > 500, `标题应在右上，x=${wishTitle?.x} y=${wishTitle?.y}`);
assert.ok(wishPity && wishPity.y >= 168 && wishPity.y < 250, `保底应在标题下，y=${wishPity?.y}`);
assert.ok(wishDock && wishDock.y > 280, `抽卡坞应贴底，y=${wishDock?.y}`);
await page.evaluate(() => document.getElementById("gachaDrawer")?.classList.add("hidden"));
await api(page, "start");
await page.waitForTimeout(400);
await page.evaluate(() => {
  const skip = document.getElementById("tutorialSkip37");
  if (skip) skip.click();
});
await page.waitForTimeout(200);
await api(page, "start");
await page.waitForTimeout(400);
await api(page, "dismissDialogue");
await api(page, "protectPlayer");
await page.evaluate(() => {
  const box = document.getElementById("banter");
  if (box) {
    box.classList.remove("hidden");
    document.getElementById("banterSpeaker").textContent = "雨宫凛";
    document.getElementById("banterText").textContent = "电台接通。你负责走位。";
  }
});
await page.screenshot({ path: path.join(out, "radio.png") });
const radio = await boxOf(page, "#banter");
assert.ok(radio && !radio.hidden, "电台可见");
assert.ok(radio.x < 80, `电台应靠左，实际 x=${radio.x}`);
assert.ok(radio.w <= 220, `电台应是薄条，实际 w=${radio.w}`);
assert.ok(radio.bottom <= 430 - 140, `电台不得压摇杆，bottom=${radio.bottom}`);

await api(page, "triggerUpgrade");
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "upgrade.png") });
const level = await boxOf(page, "#level");
const modal = await boxOf(page, "#level .modal");
const pick = await boxOf(page, "#level .choice");
assert.ok(level && !level.hidden, "升级层打开");
assert.ok(modal && modal.x > 500, `职业选择应在右侧，modal.x=${modal.x}`);
assert.ok(modal.w <= 340, `职业选择不应占中，w=${modal.w}`);
assert.ok(pick && pick.x > 500, `选项应在右拇指区，x=${pick.x}`);

await browser.close();
console.log("layout47 ok", { shop, buy, radio, modal });

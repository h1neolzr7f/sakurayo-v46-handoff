import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "tests/artifacts/mobile");
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 915, height: 412 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 SakurayoAndroid/4.7.3-yeying",
});
await context.addInitScript(() => {
  window.__SAKURAYO_ANDROID_LANDSCAPE__ = true;
  localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true, coins: 880 }));
});
const page = await context.newPage();
await page.goto(`${pathToFileURL(path.join(root, "src/index.html")).href}?test=1`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForFunction(() => document.getElementById("start"), null, { timeout: 30000 });
await page.waitForTimeout(400);

const shot = (name) => page.screenshot({ path: path.join(out, name), fullPage: true });
const tap = async (sel) => {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 8000 });
  const box = await loc.boundingBox();
  assert.ok(box && box.w >= 24 || (box && box.width >= 24), sel);
  await loc.tap({ timeout: 5000 }).catch(() => loc.click({ force: true, noWaitAfter: true }));
};

const boot = await page.evaluate(() => ({
  land: document.documentElement.classList.contains("landscape46"),
  fallback: document.documentElement.classList.contains("portraitFallback46"),
  utility: getComputedStyle(document.querySelector(".utilityButtons37") || document.body).display,
  start: !!document.getElementById("start"),
}));
assert.equal(boot.land, true);
assert.equal(boot.fallback, false);
await shot("01-lobby.png");

for (const [sel, name] of [
  [".homeNav46 [data-open='gacha']", "02-gacha.png"],
  [".homeNav46 [data-open='shop']", "03-shop.png"],
  [".homeNav46 [data-open='roster']", "04-roster.png"],
  [".homeNav46 [data-open='stage']", "05-stage.png"],
  [".homeNav46 [data-open='archive']", "06-archive.png"],
]) {
  await page.evaluate((sel) => document.querySelector(sel)?.click(), sel);
  await page.waitForTimeout(280);
  await shot(name);
  await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));
}

await page.evaluate(() => document.querySelector('[data-home="settings"]')?.click());
await page.waitForTimeout(240);
await shot("07-settings.png");
await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));

await shot("08-lobby-return.png");
await browser.close();
console.log("PASS mobile lobby", out, boot);

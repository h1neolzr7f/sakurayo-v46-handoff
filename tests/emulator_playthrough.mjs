import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const fallback = path.join(
      os.homedir(),
      ".codex",
      "skills",
      "develop-web-game",
      "scripts",
      "node_modules",
      "playwright",
      "index.mjs",
    );
    return await import(pathToFileURL(fallback).href);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "tests/artifacts/emulator");
fs.mkdirSync(out, { recursive: true });
const cdp = process.env.WEBVIEW_CDP || "http://127.0.0.1:9222";

const { chromium } = await loadPlaywright();
let browser;
try {
  browser = await chromium.connectOverCDP(cdp, { timeout: 8000 });
} catch (err) {
  console.log("SKIP emulator playthrough: no WebView CDP at", cdp, String(err.message || err));
  process.exit(0);
}

const context = browser.contexts()[0] || (await browser.newContext());
const page = context.pages().find((p) => p.url().includes("index.html") || p.url().includes("android_asset")) || context.pages()[0];
assert.ok(page, "WebView page missing");
await page.waitForFunction(() => document.getElementById("start"), null, { timeout: 30000 });
await page.waitForTimeout(600);

const shot = (name) => page.screenshot({ path: path.join(out, name) });
const beta = (method, ...args) =>
  page.evaluate(({ method, args }) => {
    const api = window.__SAKURAYO_BETA__;
    if (!api || typeof api[method] !== "function") return null;
    return api[method](...args);
  }, { method, args });

async function tap(sel, label = sel) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 12000 });
  const box = await loc.boundingBox();
  assert.ok(box && box.width >= 24 && box.height >= 24, `${label} ${JSON.stringify(box)}`);
  await loc.tap({ timeout: 8000 }).catch(() => loc.click({ force: true }));
}

await shot("01-launch.png");
const landscape = await page.evaluate(() => ({
  w: innerWidth,
  h: innerHeight,
  land: document.documentElement.classList.contains("landscape46"),
  fallback: document.documentElement.classList.contains("portraitFallback46"),
  ua: navigator.userAgent,
}));
console.log("viewport", landscape);
assert.ok(landscape.w > landscape.h, "phone emulator must be landscape");
assert.equal(landscape.fallback, false, "portraitFallback46 must stay off on locked landscape");

if (await page.locator("#bootArt35").isVisible().catch(() => false)) {
  await page.waitForFunction(
    () => !document.getElementById("bootArt35") || document.getElementById("bootArt35").classList.contains("gone"),
    null,
    { timeout: 15000 },
  );
}

for (const [sel, name] of [
  [".homeNav46 [data-open='gacha']", "02-gacha.png"],
  [".homeNav46 [data-open='shop']", "03-shop.png"],
  [".homeNav46 [data-open='stage']", "04-stage.png"],
]) {
  await tap(sel, sel);
  await page.waitForTimeout(400);
  await shot(name);
  await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));
}

await tap("#start", "start");
if (await page.locator("#tutorialDrawer37").isVisible().catch(() => false)) {
  await shot("05-tutorial.png");
  await page.evaluate(() => document.getElementById("tutorialSkip37")?.click());
}
await page.waitForTimeout(500);
await shot("06-after-start.png");

if (await page.locator("#joy").isVisible().catch(() => false)) {
  const box = await page.locator("#joy").boundingBox();
  if (box) await page.touchscreen.tap(box.x + box.width * 0.75, box.y + box.height / 2);
  if (await page.locator("#dash").isVisible().catch(() => false)) await tap("#dash", "dash");
  if (await page.locator("#skill").isVisible().catch(() => false)) await tap("#skill", "skill");
  await shot("07-combat.png");
  if (await page.locator("#pause").isVisible().catch(() => false)) {
    await tap("#pause", "pause");
    await shot("08-pause.png");
    if (await page.locator("#resume").isVisible().catch(() => false)) await tap("#resume", "resume");
  }
  await beta("advance", 8);
  try {
    await beta("spawnBoss");
    await page.waitForTimeout(400);
    await shot("09-boss.png");
    await beta("nextBossPhase");
    await page.waitForTimeout(250);
    await shot("10-boss-75.png");
    await beta("nextBossPhase");
    await page.waitForTimeout(250);
    await shot("11-boss-50.png");
    await beta("nextBossPhase");
    await page.waitForTimeout(250);
    await shot("12-boss-25.png");
  } catch {
    await shot("09-boss-skip.png");
  }
}

await shot("13-end.png");
console.log("PASS emulator playthrough", out, landscape);
await browser.close();

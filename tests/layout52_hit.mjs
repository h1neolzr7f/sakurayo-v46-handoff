import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const fixture = path.join(here, "fixtures/lobby_touch54.html");
const artifactDir = path.join(root, "tests/artifacts/layout52");
fs.mkdirSync(artifactDir, { recursive: true });

function overlapArea(a, b) {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 360, height: 800 },
  isMobile: true,
  hasTouch: true,
});
await context.addInitScript(() => {
  window.__SAKURAYO_ANDROID_LANDSCAPE__ = true;
});
const page = await context.newPage();
await page.goto(pathToFileURL(fixture).href, { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForFunction(() => window.SakurayoLayout52 && document.getElementById("sakurayo-layout52-css"));

const state = await page.evaluate(() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      sel,
      x: r.x,
      y: r.y,
      w: r.width,
      h: r.height,
      pointer: s.pointerEvents,
      touch: s.touchAction,
      z: s.zIndex,
    };
  };
  return {
    html: [...document.documentElement.classList],
    start: box("#start"),
    shop: box("#navShop"),
    char: box("#charAya"),
    hero: box("#heroLive46"),
    deck: box(".homeDeck46"),
    menu: box("#menu .menu"),
    bodyTouch: getComputedStyle(document.body).touchAction,
  };
});

assert.ok(state.html.includes("androidLandscape46"));
assert.ok(state.html.includes("landscape46"));
assert.ok(!state.html.includes("portraitFallback46"));
assert.match(state.bodyTouch, /manipulation/);
assert.equal(state.start.pointer, "auto");
assert.equal(state.shop.pointer, "auto");
assert.equal(state.char.pointer, "auto");
assert.equal(state.hero.pointer, "none");
assert.equal(state.menu.pointer, "auto");
assert.equal(state.deck.pointer, "auto");
assert.ok(state.start.w > 40 && state.start.h > 30, "出击按钮应有可点面积");
assert.ok(overlapArea(state.start, state.hero) < state.start.w * state.start.h * 0.35, "出击不应被立绘大面积盖住");

await page.locator("#start").click();
await page.locator("#navShop").click();
await page.locator("#charAya").click();
const clicks = await page.evaluate(() => window.__clicks);
assert.equal(clicks.start, 1);
assert.equal(clicks.shop, 1);
assert.equal(clicks.char, 1);

await page.screenshot({ path: path.join(artifactDir, "android-360x800-after-fix.png") });
await browser.close();
console.log("layout52_hit ok", JSON.stringify({ clicks, html: state.html }));

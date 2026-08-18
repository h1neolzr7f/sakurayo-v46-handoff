import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "android-app/app/src/main/assets/index.html");
const out = path.join(root, "tests/artifacts/android-webview");
fs.mkdirSync(out, { recursive: true });

const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 SakurayoAndroid/4.7.0-yeying";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 915, height: 412 },
  isMobile: true,
  hasTouch: true,
  userAgent: ANDROID_UA,
});
await context.addInitScript(() => {
  window.__SAKURAYO_ANDROID_LANDSCAPE__ = true;
  localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true }));
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(`${pathToFileURL(source).href}?test=1&beta=1`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, {
  timeout: 30000,
});
await page.waitForTimeout(500);

const raceEval = (fn, label, ms = 8000) =>
  Promise.race([
    page.evaluate(fn),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out`)), ms)),
  ]);

const api = (method, ...args) =>
  Promise.race([
    page.evaluate(({ method, args }) => {
      const out = window.__SAKURAYO_TEST__[method](...args);
      try {
        return JSON.parse(JSON.stringify(out));
      } catch {
        return { mode: out && out.mode, runMode: out && out.runMode };
      }
    }, { method, args }),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${method} timed out`)), 8000)),
  ]);

const shot = (name) => page.screenshot({ path: path.join(out, name), fullPage: true });
const tap = async (sel, label = sel) => {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 12000 });
  const box = await loc.boundingBox();
  assert.ok(box && box.width >= 24 && box.height >= 24, `${label} ${JSON.stringify(box)}`);
  await loc.tap({ timeout: 8000 }).catch(() => loc.click({ force: true }));
};

const land = await page.evaluate(() => ({
  w: innerWidth,
  h: innerHeight,
  land: document.documentElement.classList.contains("landscape46"),
  fallback: document.documentElement.classList.contains("portraitFallback46"),
  feel: !!(window.SakurayoFeel53 && window.SakurayoFeel53.applyPassword),
  touch: !!(window.SakurayoTouch54 && window.SakurayoTouch54.syncHits),
}));
console.log("android webview boot", land);
assert.ok(land.w > land.h, "android html must be landscape");
assert.equal(land.fallback, false);
assert.equal(land.feel, true, "feel53 must boot from assets/runtime");
assert.equal(land.touch, true, "touch54 must boot from assets/runtime");
await shot("01-lobby.png");

await tap(".homeNav46 [data-open='gacha']", "gacha");
await page.waitForTimeout(300);
await shot("02-gacha.png");
await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));

await tap(".homeNav46 [data-open='shop']", "shop");
await page.waitForTimeout(300);
await shot("03-shop.png");
await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));

await api("selectCharacter", "sayo");
await api("selectStage", 1);
const started = await api("start");
if (started.mode === "dialogue") await api("dismissDialogue");
assert.equal((await api("snapshot")).mode, "play");
await api("protectPlayer");
await tap("#dash", "dash");
await tap("#skill", "skill");
await shot("04-combat.png");

await api("triggerUpgrade");
if (await page.locator("#choices .choice").count()) {
  await page.locator("#choices .choice").first().tap({ timeout: 8000 }).catch(() =>
    page.locator("#choices .choice").first().click({ force: true }),
  );
}
assert.equal((await api("snapshot")).mode, "play");

await api("spawnBossNow");
if ((await api("snapshot")).mode === "dialogue") await api("dismissDialogue");
for (const ratio of [0.75, 0.5, 0.25]) {
  await api("setBossHpRatio", ratio);
  await page.evaluate(() => window.advanceTime(17));
  if ((await api("snapshot")).mode === "dialogue") await api("dismissDialogue");
}
await shot("05-boss.png");
await api("defeatBoss");
if ((await api("snapshot")).mode === "dialogue") await api("dismissDialogue");
if ((await api("snapshot")).mode !== "result") await api("finish", true);
await shot("06-result.png");
if (await page.locator("#back").isVisible().catch(() => false)) await tap("#back", "back");
else await api("backMenu");
assert.equal((await api("snapshot")).mode, "menu");
await shot("07-lobby.png");

for (const id of ["aya", "rion"]) {
  await api("selectCharacter", id);
  const run = await api("start");
  if (run.mode === "dialogue") await api("dismissDialogue");
  assert.equal((await api("snapshot")).mode, "play", id);
  await api("backMenu");
}

await browser.close();
const real = errors.filter((e) => !/favicon|net::ERR|Failed to load resource/i.test(e));
assert.equal(real.length, 0, real.join("\n"));
console.log("PASS android webview playthrough", out, land);

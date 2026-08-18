import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const fallback = path.join(os.homedir(), ".codex", "skills", "develop-web-game", "scripts", "node_modules", "playwright", "index.mjs");
    return await import(pathToFileURL(fallback).href);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "src/index.html");
const { chromium } = await loadPlaywright();
console.log("ops_smoke: launching chromium");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 932, height: 430 } });
await context.addInitScript(() => {
  localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true }));
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", err => {
  pageErrors.push(String(err));
  console.log("ops_smoke pageerror", String(err));
});
console.log("ops_smoke: goto");
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
console.log("ops_smoke: wait test api");
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && window.SakurayoOps && document.getElementById("start"), null, { timeout: 30000 });
console.log("ops_smoke: ready");
const boot = await page.evaluate(() => ({
  rotate: (() => {
    const n = document.getElementById("rotateHint46");
    return !n || n.classList.contains("hidden") || getComputedStyle(n).display === "none";
  })(),
  land: document.documentElement.classList.contains("landscape46"),
  fallback: document.documentElement.classList.contains("portraitFallback46"),
  live: document.getElementById("heroLive46")?.classList.contains("livePuppet46") || false,
  attached: !!window.SakurayoLive?.snapshot()?.attached,
  tap: window.__SAKURAYO_TEST__.liveTrigger46("tapHead")?.lastKind || "",
}));
console.log("ops_smoke: boot", boot);
assert.equal(boot.rotate, true);
assert.equal(boot.land, true);
assert.equal(boot.fallback, false);
assert.equal(boot.live, true);
assert.equal(boot.attached, true);
assert.equal(boot.tap, "tapHead");

const api = (method, ...args) =>
  page.evaluate(({ method, args }) => {
    const out = window.__SAKURAYO_TEST__[method](...args);
    try {
      return JSON.parse(JSON.stringify(out));
    } catch {
      return { mode: out && out.mode, runMode: out && out.runMode, ok: out && out.ok, reason: out && out.reason };
    }
  }, { method, args });
const snap = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));

console.log("ops_smoke: start via api");
console.log(
  "ops_smoke: select",
  await page.evaluate(() => {
    window.__SAKURAYO_TEST__.selectCharacter("sayo");
    return "ok";
  }),
);
console.log(
  "ops_smoke: stage",
  await page.evaluate(() => {
    window.__SAKURAYO_TEST__.selectStage(1);
    return "ok";
  }),
);
const ops = await page.evaluate(() => {
  const snap = window.SakurayoOps.snapshot();
  return {
    version: snap.version,
    dp: snap.dp,
    units: snap.units.length,
    testimony: window.SakurayoOps.enabled("testimony"),
    story: window.SakurayoOps.enabled("story"),
  };
});
assert.equal(ops.dp, 10);
assert.equal(ops.units, 0);
assert.equal(ops.story, true);
assert.equal(ops.testimony, false);
assert.equal(await snap().then((s) => s.mode), "menu");

await browser.close();
const real = pageErrors.filter((e) => !/SMOKE_EXPECTED|favicon|net::ERR/i.test(e));
assert.equal(real.length, 0, real.join("\n"));
console.log("PASS ops smoke: landscape lobby, ops story-on testimony-off, no start hang");

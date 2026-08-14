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
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 932, height: 430 } });
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });

const api = (method, ...args) => page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
const snap = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));

await api("openDrawer", "stage");
assert.equal(await page.locator("#modeBar46").count(), 1);
assert.match(await page.locator("#modeBar46").textContent(), /证词模式/);
await page.locator("#stageDrawer .close").click();
await page.locator("#start").click();
if (await page.locator("#tutorialDrawer37").isVisible()) {
  for (let i = 0; i < 4; i++) await page.locator("#tutorialNext37").click();
}
if ((await snap()).mode !== "menu") {
  await api("dismissDialogue");
  await api("backMenu");
}
await api("selectCharacter", "sayo");
await api("selectStage", 1);
const mode = await api("setRunMode46", "testimony");
assert.equal(mode.runMode, "testimony");
const started = await api("start");
if (started.mode !== "dialogue" && started.mode !== "play") {
  throw new Error(`start left mode=${started.mode} runMode=${started.runMode}`);
}
if (started.mode === "dialogue") await api("dismissDialogue");
assert.match(await page.locator("#stageHud").textContent(), /证词/);
await api("protectPlayer");
await api("triggerUpgrade");
const after = await snap();
assert.equal(after.mode, "play");
assert.equal(await page.locator("#level").isVisible(), false);
await browser.close();
console.log("PASS testimony smoke: mode bar, no upgrade modal");

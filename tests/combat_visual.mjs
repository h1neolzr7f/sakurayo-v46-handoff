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
const source = path.resolve(root, "src/index.html");
const artifactDir = path.resolve(root, "tests/artifacts/combat");
fs.mkdirSync(artifactDir, { recursive: true });
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 932, height: 430 },
  isMobile: true,
  hasTouch: true,
});
const errors = [];
page.on("pageerror", error => errors.push(String(error)));
page.on("console", message => {
  if (message.type() === "error") errors.push(message.text());
});
await page.goto(`${pathToFileURL(source).href}?test=1`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"));
const api = (method, ...args) =>
  page.evaluate(
    ({ method, args }) => window.__SAKURAYO_TEST__[method](...args),
    { method, args },
  );
const snap = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));

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
await api("start");
await api("dismissDialogue");
await api("protectPlayer");
await api("freezeProgression");
await api("deployOp46", "aya");
await api("grantDp46", 8);
await api("deployOp46", "rion");
await api("spawnEnemyNear", "normal", 90);
await page.evaluate(() => window.advanceTime(1200));
await page.locator("#skill").click();
await page.evaluate(() => window.advanceTime(17));
let state = await snap();
assert.equal(state.stage44.presentation.skill, "sayo");
assert.deepEqual(state.ops.units.map(unit => unit.weapon).sort(), ["blade", "pistol"]);
await page.screenshot({
  path: path.join(artifactDir, "skill-and-operators-932x430.png"),
});

await api("spawnBossNow");
assert.equal((await snap()).mode, "dialogue");
assert.equal(await page.locator("#warning").isVisible(), false);
await api("dismissDialogue");
await api("setBossHpRatio", 0.75);
await page.evaluate(() => window.advanceTime(17));
state = await snap();
assert.equal(state.mode, "dialogue");
assert.equal(state.stage44.presentation.kind, "phase");
assert.equal(state.stage44.presentation.phase, 2);
await api("dismissDialogue");
await page.evaluate(() => window.advanceTime(180));
assert.equal(await page.locator("#bossPhaseGates46 i").count(), 3);
await page.screenshot({
  path: path.join(artifactDir, "boss-phase-2-932x430.png"),
});

assert.deepEqual(errors, []);
await browser.close();
console.log(`PASS combat visual ${artifactDir}`);

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
page.on("pageerror", err => {
  throw err;
});
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && window.SakurayoOps && document.getElementById("start"), null, { timeout: 30000 });
assert.equal(await page.locator("#rotateHint46").isVisible(), false);
assert.ok(await page.evaluate(() => document.documentElement.classList.contains("landscape46")));
assert.equal(await page.evaluate(() => document.documentElement.classList.contains("portraitFallback46")), false);
assert.ok(await page.evaluate(() => document.getElementById("heroLive46")?.classList.contains("livePuppet46")));
assert.equal(await page.evaluate(() => window.SakurayoLive?.snapshot()?.attached), true);
assert.equal(await page.evaluate(() => window.__SAKURAYO_TEST__.liveTrigger46("tapHead")?.lastKind), "tapHead");

const api = (method, ...args) => page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
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
const started = await api("start");
if (started.mode === "dialogue") await api("dismissDialogue");
assert.equal((await snap()).mode, "play");
assert.equal((await snap()).runMode, "story");

await api("protectPlayer");
await api("freezeProgression");
const dock = page.locator("#opsDock46");
assert.equal(await dock.count(), 1);
assert.equal(await dock.isVisible(), true);
assert.match(await dock.textContent(), /DP/);
assert.equal(await page.locator("#opsDock46 [data-op]").count(), 2);

const before = await api("opsSnapshot46");
assert.equal(before.dp, 10);
assert.equal(before.units.length, 0);

const deployed = await api("deployOp46", "aya");
assert.equal(deployed.ok, true);
assert.equal(deployed.snapshot.dp, 2);
assert.equal(deployed.snapshot.units.length, 1);
assert.equal(deployed.snapshot.units[0].id, "aya");

const mid = await snap();
assert.equal(mid.counts.ops, 1);
assert.equal(mid.ops.units[0].id, "aya");
assert.ok(Math.abs(mid.ops.units[0].x - mid.player.x) > 30);
assert.equal(mid.ops.units[0].weapon, "pistol");

const denied = await api("deployOp46", "rion");
assert.equal(denied.ok, false);
assert.equal(denied.reason, "dp");

await api("grantDp46", 8);
const second = await api("deployOp46", "rion");
assert.equal(second.ok, true);
assert.equal(second.snapshot.units.length, 2);

const petsBefore = (await snap()).counts.pets;
await api("spawnEnemyNear", "normal", 80);
await page.evaluate(() => window.advanceTime(1400));
const afterFire = await snap();
assert.equal(afterFire.counts.ops, 2);
assert.equal(afterFire.counts.pets, petsBefore);
assert.ok(afterFire.counts.bullets >= 0);
assert.deepEqual(afterFire.ops.units.map(unit => unit.weapon).sort(), ["blade", "pistol"]);

const retreated = await api("retreatOp46", "aya");
assert.equal(retreated.ok, true);
assert.equal(retreated.snapshot.units.length, 1);

await api("backMenu");
await api("setRunMode46", "testimony");
const testimony = await api("start");
if (testimony.mode === "dialogue") await api("dismissDialogue");
assert.equal((await snap()).runMode, "testimony");
assert.equal(await dock.isVisible(), false);
const blocked = await api("deployOp46", "aya");
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, "mode");

await browser.close();
console.log("PASS ops smoke: story deploy 2, testimony hidden, pets untouched");

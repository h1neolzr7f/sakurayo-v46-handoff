import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const fixture = path.join(here, "fixtures/touch54_all_surfaces.html");
const artifactDir = path.join(root, "tests/artifacts/touch54");
fs.mkdirSync(artifactDir, { recursive: true });

const ids = [
  "start", "charAya", "modeTestimony", "modeDomain",
  "navGacha", "navRoster", "navShop", "navStage", "navArchive",
  "railMission", "railAch", "railMail", "railSettings",
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 800, height: 360 },
  isMobile: true,
  hasTouch: true,
  userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36 SakurayoAndroid/4.7.0-yeying",
});
const page = await context.newPage();
await page.goto(pathToFileURL(fixture).href, { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForFunction(() => window.SakurayoTouch54 && window.SakurayoLayout52);

const hits = await page.evaluate(() => window.SakurayoTouch54.syncHits());
assert.equal(hits.blocked, true);
assert.equal(hits.canvas, "none");

for (const id of ids) {
  await page.locator("#" + id).tap({ timeout: 8000 });
}

const afterLobby = await page.evaluate(() => ({ clicks: window.__clicks, canvas: window.__canvasDown }));
for (const id of ids) {
  assert.equal(afterLobby.clicks[id], 1, id + " 应能点到");
}
assert.equal(afterLobby.canvas, 0, "大厅点按不得落到画布");

await page.evaluate(() => {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("shopDrawer").classList.remove("hidden");
});
await page.locator("#shopBuy").tap();
await page.locator("#shopClose").tap();

await page.evaluate(() => {
  document.getElementById("shopDrawer").classList.add("hidden");
  document.getElementById("gachaDrawer").classList.remove("hidden");
});
await page.locator("#gachaPull").tap();
await page.locator("#gachaClose").tap();

await page.evaluate(() => {
  document.getElementById("gachaDrawer").classList.add("hidden");
  document.getElementById("level").classList.remove("hidden");
});
await page.locator("#levelPick").tap();

await page.evaluate(() => {
  document.getElementById("level").classList.add("hidden");
  document.getElementById("paused").classList.remove("hidden");
});
await page.locator("#resume").tap();

await page.evaluate(() => {
  document.getElementById("paused").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");
});
await page.locator("#back").tap();

await page.evaluate(() => {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("hud").classList.remove("hidden");
});
const playHits = await page.evaluate(() => window.SakurayoTouch54.syncHits());
assert.equal(playHits.blocked, false);
assert.equal(playHits.canvas, "auto");
await page.locator("#pause").tap();
await page.locator("#dash").tap();
await page.locator("#skill").tap();

const finalClicks = await page.evaluate(() => window.__clicks);
for (const id of ["shopBuy", "shopClose", "gachaPull", "gachaClose", "levelPick", "resume", "back", "pause", "dash", "skill"]) {
  assert.equal(finalClicks[id], 1, id + " 应能点到");
}

await page.screenshot({ path: path.join(artifactDir, "all-surfaces-800x360.png") });
await browser.close();
console.log("touch54_hit ok", JSON.stringify(finalClicks));

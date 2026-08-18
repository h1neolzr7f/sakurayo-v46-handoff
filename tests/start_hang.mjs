import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/index.html");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 932, height: 430 } });
page.setDefaultTimeout(12000);
await page.addInitScript(() => {
  localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true }));
});
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 20000 });

const boot = await page.evaluate(() => {
  const start = document.getElementById("start");
  return {
    mode: window.__SAKURAYO_TEST__.snapshot().mode,
    start: !!(start && start.getBoundingClientRect().width >= 80),
  };
});
assert.equal(boot.mode, "menu");
assert.equal(boot.start, true);

const switched = await page.evaluate(() => {
  const a = Date.now();
  window.__SAKURAYO_TEST__.selectCharacter("aya");
  window.__SAKURAYO_TEST__.selectCharacter("rion");
  window.__SAKURAYO_TEST__.selectCharacter("sayo");
  return { ms: Date.now() - a, char: window.__SAKURAYO_TEST__.snapshot().player.character };
});
assert.equal(switched.char, "sayo");
assert.ok(switched.ms < 4000, `character swap froze (${switched.ms}ms)`);

const started = await page.evaluate(() => {
  const a = Date.now();
  window.__SAKURAYO_TEST__.selectStage(1);
  const snap = window.__SAKURAYO_TEST__.start();
  return { ms: Date.now() - a, mode: snap.mode, runMode: snap.runMode };
});
assert.ok(started.ms < 4000, `startGame froze (${started.ms}ms)`);
assert.ok(started.mode === "dialogue" || started.mode === "play", started.mode);

if (started.mode === "dialogue") {
  const dismissed = await page.evaluate(() => window.__SAKURAYO_TEST__.dismissDialogue());
  assert.equal(dismissed.mode, "play");
}

const play = await page.evaluate(() => window.__SAKURAYO_TEST__.snapshot().mode);
assert.equal(play, "play");

const back = await page.evaluate(() => {
  const a = Date.now();
  const snap = window.__SAKURAYO_TEST__.backMenu();
  return { ms: Date.now() - a, mode: snap.mode };
});
assert.equal(back.mode, "menu");
assert.ok(back.ms < 4000, `backMenu froze (${back.ms}ms)`);

await browser.close();
console.log("PASS start hang", started, switched, back);

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
console.log("start_hang: goto");
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 60000 });
console.log("start_hang: wait api");
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 20000 });

const boot = await page.evaluate(() => {
  const start = document.getElementById("start");
  return {
    mode: window.__SAKURAYO_TEST__.snapshot().mode,
    startW: start ? start.offsetWidth : 0,
  };
});
console.log("start_hang: boot", boot);
assert.equal(boot.mode, "menu");
assert.ok(boot.startW >= 80, `start width ${boot.startW}`);
await page.waitForTimeout(400);

const raceEval = (fn, arg, label, ms = 8000) =>
  Promise.race([
    page.evaluate(fn, arg),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out`)), ms)),
  ]);

const switched = { ms: 0, char: "" };
const swapT = Date.now();
for (const id of ["aya", "rion", "sayo"]) {
  console.log("start_hang: select", id);
  const inner = await raceEval((next) => {
    const a = Date.now();
    window.__SAKURAYO_TEST__.selectCharacter(next);
    return Date.now() - a;
  }, id, "select-" + id);
  console.log("start_hang: selected", id, inner);
  switched.ms += inner;
}
switched.char = await raceEval(() => window.__SAKURAYO_TEST__.snapshot().player.character, null, "snap-char");
switched.ms = Date.now() - swapT;
assert.equal(switched.char, "sayo");
assert.ok(switched.ms < 8000, `character swap froze (${switched.ms}ms)`);

console.log("start_hang: start");
const started = await raceEval(() => {
  const a = Date.now();
  window.__SAKURAYO_TEST__.selectStage(1);
  const snap = window.__SAKURAYO_TEST__.start();
  return { ms: Date.now() - a, mode: snap.mode, runMode: snap.runMode };
}, null, "start");
console.log("start_hang: started", started);
assert.ok(started.ms < 4000, `startGame froze (${started.ms}ms)`);
assert.ok(started.mode === "dialogue" || started.mode === "play", started.mode);

if (started.mode === "dialogue") {
  const dismissed = await raceEval(() => window.__SAKURAYO_TEST__.dismissDialogue(), null, "dismiss");
  assert.equal(dismissed.mode, "play");
}

const play = await raceEval(() => window.__SAKURAYO_TEST__.snapshot().mode, null, "play-snap");
assert.equal(play, "play");

console.log("start_hang: back");
const back = await raceEval(() => {
  const a = Date.now();
  const snap = window.__SAKURAYO_TEST__.backMenu();
  return { ms: Date.now() - a, mode: snap.mode };
}, null, "back");
assert.equal(back.mode, "menu");
assert.ok(back.ms < 4000, `backMenu froze (${back.ms}ms)`);

await browser.close();
console.log("PASS start hang", started, switched, back);

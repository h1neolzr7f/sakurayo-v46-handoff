import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "tests/fixtures/feel53_lobby.html");
const out = path.join(root, "tests/artifacts/feel53_hang");
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(8000);
await page.goto(pathToFileURL(fixture).href, { waitUntil: "load", timeout: 8000 });

const first = await page.evaluate(() => ({
  feel: !!(window.SakurayoFeel53 && window.SakurayoFeel53.applyPassword),
  chip: (document.querySelector("#start .pass53") || {}).textContent || "",
  ticks: window.__feel53Probe.ticks,
}));
assert.equal(first.feel, true, "feel53 should install");
assert.equal(first.chip, "");

await page.evaluate(() => {
  for (let i = 0; i < 40; i++) window.SakurayoFeel53.applyPassword("sayo");
  document.getElementById("start").appendChild(document.createTextNode("出击"));
});
await page.waitForFunction(() => window.__feel53Probe.ticks > 8, null, { timeout: 3000 });
const after = await page.evaluate(() => ({
  ticks: window.__feel53Probe.ticks,
  chip: (document.querySelector("#start .pass53") || {}).textContent || "",
  responsive: document.title,
}));
assert.ok(after.ticks > 8, "main thread must keep ticking after password calls");
assert.equal(after.chip, "");
await page.screenshot({ path: path.join(out, "lobby.png") });
await browser.close();
console.log("feel53 hang probe ok", after);

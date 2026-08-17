import fs from "node:fs";
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
const out = path.join(root, "tests/artifacts/gacha");
fs.mkdirSync(out, { recursive: true });
const source = path.resolve(root, "src/index.html");
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 932, height: 430 } });
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(out, "lobby.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.grantCheat46());
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("gacha"));
await page.waitForSelector("#gachaPull1", { timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, "gacha.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.pullGacha46(1));
await page.waitForSelector("#gachaReveal46", { timeout: 8000 });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "reveal.png"), fullPage: true });
await page.evaluate(() => {
  const el = document.getElementById("gachaReveal46");
  if (el && el.parentNode) el.parentNode.removeChild(el);
});
await page.evaluate(() => window.__SAKURAYO_TEST__.pullGacha46(10));
await page.waitForSelector("#gachaReveal46", { timeout: 8000 });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "reveal-ten.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("roster"));
await page.waitForSelector("#rosterWall46", { timeout: 8000 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, "roster.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("shop"));
await page.waitForSelector("#shopDrawer", { timeout: 8000 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, "shop.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("stage"));
await page.waitForSelector("#modeBar46", { timeout: 8000 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, "stage.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("archive"));
await page.waitForSelector("#archiveDrawer .archiveDock46", { timeout: 8000 });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, "archive.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("talent"));
await page.waitForSelector("#talentList", { timeout: 8000 });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "talent.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("story"));
await page.waitForSelector("#storyList", { timeout: 8000 });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "story.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("asc"));
await page.waitForSelector("#ascList", { timeout: 8000 });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "asc.png"), fullPage: true });
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("ach"));
await page.waitForSelector("#achList", { timeout: 8000 });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "ach.png"), fullPage: true });
const broken = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("#gachaDrawer img, #rosterDrawer img, .homeNav46 img, #menu.homeDock46 .bg")];
  return imgs.filter((img) => img.tagName === "IMG" && !img.naturalWidth).map((img) => img.getAttribute("src"));
});
await browser.close();
if (broken.length) {
  console.error("BROKEN", broken);
  process.exit(1);
}
console.log("PASS gacha visual", out);

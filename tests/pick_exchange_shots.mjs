import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const url = `${pathToFileURL(path.resolve(root, "src/index.html")).href}?test=1`;

const api = (page, method, ...args) =>
  page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 932, height: 430 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
await page.waitForTimeout(800);
await api(page, "selectCharacter", "sayo");
await page.waitForTimeout(300);
const layout = await page.evaluate(() => {
  const box = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) };
  };
  return {
    wallet: box("#homeWallet47"),
    purse: box(".homePurse47"),
    tools: box(".homeTools47"),
    start: box("#start"),
    crests: box("#homeCrests47"),
    rail: box(".homeRail47"),
    status: box(".homeStatus47"),
    chars: box(".charSelectPanel"),
    nav: box(".homeNav46"),
    modes: box("#homeModes47"),
    stage: box(".stageMini"),
    vh: innerHeight,
    vw: innerWidth,
  };
});
console.log("LAYOUT", JSON.stringify(layout));
await page.screenshot({ path: path.join(out, "lobby-layout-sayo.png") });

const before = await api(page, "wallet47");
const pick = await api(page, "pickPortrait47");
await page.waitForTimeout(80);
await page.screenshot({ path: path.join(out, "lobby-pick-plus1.png") });
const after = await api(page, "wallet47");
console.log("PICK", { before, pick, after });

await api(page, "selectCharacter", "aya");
await api(page, "pickPortrait47");
await page.waitForTimeout(80);
await page.screenshot({ path: path.join(out, "lobby-pick-aya.png") });

await api(page, "selectCharacter", "rion");
await api(page, "pickPortrait47");
await page.waitForTimeout(80);
await page.screenshot({ path: path.join(out, "lobby-pick-rion.png") });

await api(page, "grantCoins40", 200);
await api(page, "openExchange47");
await page.waitForTimeout(300);
const chrome = await api(page, "homeChrome47");
await page.screenshot({ path: path.join(out, "exchange-drawer.png") });
console.log("EXCHANGE_UI", chrome);

const ex = await api(page, "exchange47", "shard", 1);
const wallet = await api(page, "wallet47");
await page.screenshot({ path: path.join(out, "exchange-after-shard.png") });
console.log("EX", { ex, wallet, crests: chrome.crests });

await browser.close();
console.log("DONE", out);

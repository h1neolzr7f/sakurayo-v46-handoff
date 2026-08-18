import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "src/index.html");
const out = path.join(root, "tests/artifacts/shop_boutique");
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 360 }, isMobile: true, hasTouch: true });
page.on("pageerror", (err) => {
  throw err;
});
await page.addInitScript(() => {
  window.__SAKURAYO_ANDROID_LANDSCAPE__ = true;
  localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true, coins: 20000 }));
});
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
await page.addScriptTag({ path: path.join(root, "src/runtime/sakurayo-boutique.js") });
await page.evaluate(() => window.SakurayoBoutique?.install?.());
await page.waitForTimeout(400);

const api = (method, ...args) => page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
await api("openDrawer", "shop");
await page.waitForSelector("#shopList .skinCard", { timeout: 8000 });
assert.match(
  (await page.locator("#shopDrawer .dhead h2").textContent()) || "",
  /时装商店/,
  "opening shop must use the boutique, not the supply-station title"
);
await page.evaluate(() => {
  window.SakurayoBoutique?.install?.();
  window.SakurayoShell?.decorateShop?.(document.getElementById("shopDrawer"), {
    save: JSON.parse(localStorage.getItem("sakurayoV3") || "{}"),
    clickTab() {},
  });
});

const info = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("[data-shop-group=skins] .skinCard")];
  const shown = cards.filter((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 8 && r.height > 8;
  });
  const pitches = [...document.querySelectorAll("[data-shop-group=skins] .shopPitch46")].map((el) => el.textContent);
  const tags = [...document.querySelectorAll("[data-shop-group=skins] .skinCard .shopTag46")].map((el) => el.textContent);
  const desc = shown.map((el) => ((el.querySelector("p") && getComputedStyle(el.querySelector("p")).display) || "none"));
  return {
    title: document.querySelector("#shopDrawer .dhead h2")?.textContent || "",
    sub: document.querySelector("#shopDrawer .dhead p")?.textContent || "",
    rail: [...document.querySelectorAll(".shopRail46 button")].map((el) => el.textContent.replace(/\s+/g, " ").trim()),
    cards: cards.length,
    shown: shown.length,
    pitches,
    tags,
    descShown: desc.filter((d) => d !== "none").length,
    hero: document.querySelector("#shopFeatured46 .shopSkin46 h3")?.textContent || "",
    heroKicker: document.querySelector("#shopFeatured46 .shopHeroKicker46")?.textContent || "",
    featuredGoods: document.querySelectorAll("#shopFeatured46 .shopGood46").length,
    hiddenGroups: !!document.querySelector("#shopDrawer.isFeatured46"),
    boutique: document.getElementById("shopDrawer")?.classList.contains("isBoutique46"),
  };
});

assert.ok(info.cards >= 11, "wardrobe must list every costume");
assert.match(info.title, /时装商店/);
assert.match(info.sub, /全套上架/);
assert.deepEqual(info.rail, ["橱窗全套上架", "补给柜核心道具", "兑换货币柜台"]);
assert.equal(info.shown, info.cards);
assert.equal(info.pitches.length, info.cards);
assert.ok(info.pitches.every((t) => t && t.length >= 6));
assert.ok(info.tags.length >= info.cards);
assert.ok(info.descShown >= info.cards);
assert.ok(info.hero);
assert.equal(info.heroKicker, "本期主推");
assert.equal(info.featuredGoods, 0);
assert.equal(info.hiddenGroups, false);
assert.equal(info.boutique, true);

await page.locator("[data-shop-group=skins] .skinCard").first().scrollIntoViewIfNeeded();
const inView = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("[data-shop-group=skins] .skinCard")];
  const vh = innerHeight;
  return cards.filter((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return s.display !== "none" && r.height > 8 && r.bottom > 0 && r.top < vh;
  }).length;
});
assert.ok(inView >= 1, "wardrobe cards must be on screen, got " + inView);
await page.screenshot({ path: path.join(out, "01-boutique.png") });
await page.locator("[data-shop-group=skins] .skinCard").last().scrollIntoViewIfNeeded();
await page.waitForTimeout(150);
await page.screenshot({ path: path.join(out, "02-boutique-scroll.png") });

await page.locator('[data-shop-rail="supplies"]').click();
await page.waitForTimeout(200);
assert.equal(await page.locator("#shopCounter46 .shopGood46").count(), 3);
const coinsOf = () =>
  page.locator("#coins").evaluate((el) => {
    const node = [...el.childNodes].find((n) => n.nodeType === 3);
    return Number(String((node && node.textContent) || el.textContent || "").replace(/[^\d-]/g, ""));
  });
const shopBefore = await coinsOf();
await page.locator('#shopCounter46 [data-shop-buy="starter:assault"] button').click();
assert.ok((await coinsOf()) < shopBefore, "supply counter must spend coins");
await page.screenshot({ path: path.join(out, "03-supplies.png") });

await browser.close();
console.log("PASS shop boutique", JSON.stringify(info), out);

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "src/index.html");

const SELECTORS = {
  hero: "#heroLive46",
  breath: "#heroLive46 .heroLiveBreath46",
  rail: "#homeRail46 .railIco46.mail, #homeRail46 .railIco46",
  nav: ".homeNav46 [data-open] span",
  quick: "#homeQuick46 .homeIco46",
  mode: ".homeModes46 .modeIco46",
  banner: "#homeBanner46",
};

function boxOf(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  return {
    w: Math.round(r.width),
    h: Math.round(r.height),
    display: s.display,
    svg: !!el.querySelector("svg"),
  };
}

async function measure(page, extra = {}) {
  return page.evaluate(({ SELECTORS, extra }) => {
    const one = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: s.display,
        svg: !!el.querySelector("svg"),
      };
    };
    const out = {
      hero: one(SELECTORS.hero),
      breath: one(SELECTORS.breath),
      rail: one(SELECTORS.rail),
      nav: one(SELECTORS.nav),
      quick: one(SELECTORS.quick),
      mode: one(SELECTORS.mode),
      banner: one(SELECTORS.banner),
      fallback: document.documentElement.classList.contains("portraitFallback46"),
      short: document.documentElement.classList.contains("shortWindow46"),
    };
    if (extra.shop) {
      out.preview = one("#shopDrawer .skinPreview");
      out.shopIcon = one("#shopDrawer .shopIcon40");
      out.shopRail = one(".shopRail46 button");
      out.goodIco = one(".shopGoodIco46");
    }
    if (extra.mail) {
      out.mailItem = one("#mailDrawer .shellItem46 i, .shellDrawer46 .shellItem46 i, [id*=mail] .shellItem46 i");
      out.mailIco = one("#mailDrawer .railIco46, .shellDrawer46 .railIco46.mail");
    }
    if (extra.roster) out.roster = one(".rosterArt46");
    if (extra.gacha) out.wish = one(".wishHero46");
    return out;
  }, { SELECTORS, extra });
}

function slackFor(label) {
  if (label === "hero" || label === "breath" || label === "wish" || label === "preview") return 4;
  return 2;
}

function sameBox(a, b, label) {
  if (!a && !b) return;
  assert.ok(a && b, `${label} missing ${JSON.stringify({ a, b })}`);
  assert.equal(a.display, b.display, `${label} display ${a.display} -> ${b.display}`);
  if (a.display === "none") return;
  const slack = slackFor(label);
  assert.ok(Math.abs(a.w - b.w) <= slack, `${label} width ${a.w} -> ${b.w}`);
  assert.ok(Math.abs(a.h - b.h) <= slack, `${label} height ${a.h} -> ${b.h}`);
}

function sameShot(before, after, keys) {
  for (const key of keys) sameBox(before[key], after[key], key);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 932, height: 430 },
  isMobile: true,
  hasTouch: true,
});
await page.addInitScript(() => {
  window.__SAKURAYO_ANDROID_LANDSCAPE__ = true;
  localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true, coins: 20000 }));
});
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
await page.waitForFunction(
  () => !document.getElementById("bootArt35") || document.getElementById("bootArt35").classList.contains("gone"),
  null,
  { timeout: 15000 },
);

const first = await measure(page);
assert.equal(first.fallback, false, "Android lock must not raise portraitFallback46");
assert.ok(first.hero && first.hero.w > 0, "hero must have a box");
assert.ok(first.hero.w <= Math.round(932 * 0.52), `hero too wide ${first.hero.w}`);
if (first.rail && first.rail.display !== "none") {
  assert.ok(first.rail.w <= 24, `rail icon grew past lock ${first.rail.w}`);
  assert.ok(first.rail.h <= 24, `rail icon tall ${first.rail.h}`);
}
if (first.nav && first.nav.display !== "none") {
  assert.ok(first.nav.w <= 26, `nav icon ${first.nav.w}`);
}

await page.waitForTimeout(1600);
const late = await measure(page);
sameShot(first, late, ["hero", "breath", "rail", "nav", "quick", "mode", "banner"]);

await page.evaluate(() => {
  window.SakurayoLayout52?.install?.();
  window.SakurayoBoutique?.install?.();
  window.SakurayoChrome?.install?.();
  window.SakurayoChrome?.dress?.(document);
});
const injected = await measure(page);
sameShot(first, injected, ["hero", "breath", "rail", "nav", "quick", "mode", "banner"]);

const api = (method, ...args) =>
  page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });

await api("openDrawer", "shop");
await page.waitForSelector("#shopDrawer:not(.hidden)", { timeout: 8000 });
await page.waitForTimeout(200);
const shopA = await measure(page, { shop: true });
if (shopA.preview && shopA.preview.display !== "none") {
  assert.ok(shopA.preview.h <= 90, `shop preview ${shopA.preview.h}`);
}
if (shopA.shopIcon && shopA.shopIcon.display !== "none") {
  assert.ok(shopA.shopIcon.w <= 66 && shopA.shopIcon.h <= 66, `shop icon ${JSON.stringify(shopA.shopIcon)}`);
}
await page.waitForTimeout(800);
await page.evaluate(() => {
  window.SakurayoBoutique?.install?.();
  window.SakurayoChrome?.dress?.(document);
});
const shopB = await measure(page, { shop: true });
sameShot(shopA, shopB, ["preview", "shopIcon", "shopRail", "goodIco", "hero"]);
await page.locator("#shopDrawer .close").click();

await api("openDrawer", "mail");
await page.waitForTimeout(200);
const mailA = await measure(page, { mail: true });
await page.waitForTimeout(800);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const mailB = await measure(page, { mail: true });
sameShot(mailA, mailB, ["mailItem", "mailIco", "rail"]);
if (mailA.mailItem && mailA.mailItem.display !== "none") {
  assert.ok(mailA.mailItem.w <= 44, `mail well ${mailA.mailItem.w}`);
}
await page.locator("#mailDrawer .close, .shellDrawer46 .close, [id*=mail] .close").first().click().catch(() => {});

await api("openDrawer", "roster");
await page.waitForTimeout(200);
const rosterA = await measure(page, { roster: true });
await page.evaluate(() => {
  window.SakurayoLobby?.injectStyle?.();
  window.SakurayoShell?.injectStyle?.();
});
const rosterB = await measure(page, { roster: true });
sameShot(rosterA, rosterB, ["roster"]);
if (rosterA.roster && rosterA.roster.display !== "none") {
  assert.ok(Math.abs(rosterA.roster.h - 118) <= 2, `roster art ${rosterA.roster.h}`);
}
await page.locator("#rosterDrawer .close").click();

await api("openDrawer", "gacha");
await page.waitForTimeout(200);
const gachaA = await measure(page, { gacha: true });
await page.evaluate(() => window.SakurayoLobby?.injectStyle?.());
const gachaB = await measure(page, { gacha: true });
sameShot(gachaA, gachaB, ["wish"]);
await page.locator("#gachaDrawer .close").click();

await browser.close();
console.log("PASS layout stable");
void boxOf;

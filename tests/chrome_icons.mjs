import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "src/index.html");
const out = path.join(root, "tests/artifacts/chrome_icons");
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
await page.addScriptTag({ path: path.join(root, "src/runtime/sakurayo-chrome.js") });
await page.evaluate(() => {
  window.SakurayoBoutique?.install?.();
  window.SakurayoChrome?.install?.();
});
await page.waitForTimeout(500);

const lobby = await page.evaluate(() => {
  const rails = [...document.querySelectorAll("#homeRail46 .railIco46")];
  const modes = [...document.querySelectorAll(".modeIco46")];
  const quick = [...document.querySelectorAll(".homeIco46")];
  const chips = [...document.querySelectorAll(".homeChip46 i")];
  const clip = modes.map((el) => getComputedStyle(el).clipPath || getComputedStyle(el).webkitClipPath || "none");
  return {
    railSvg: rails.filter((el) => el.querySelector("svg")).length,
    railKinds: rails.map((el) => el.getAttribute("data-chrome")),
    modeSvg: modes.filter((el) => el.querySelector("svg")).length,
    modeClip: clip,
    quickSvg: quick.filter((el) => el.querySelector("svg")).length,
    chipSvg: chips.filter((el) => el.querySelector("svg")).length,
    coinSvg: !!document.querySelector("#menu .coins .chromeCoin46 svg"),
    navSvg: [...document.querySelectorAll(".homeNav46 [data-open] span")].filter((el) => el.querySelector("svg")).length,
    navKinds: [...document.querySelectorAll(".homeNav46 [data-open] span")].map((el) => el.getAttribute("data-chrome")),
    navText: [...document.querySelectorAll(".homeNav46 [data-open] span")].map((el) => (el.textContent || "").trim()),
  };
});

assert.equal(lobby.railSvg, 5, "left rail must drop line-art drafts");
assert.deepEqual(lobby.railKinds, ["task", "medal", "mail", "notice", "gear"]);
assert.equal(lobby.modeSvg, 2, "mode tiles must drop pentagon/hex drafts");
assert.ok(lobby.modeClip.every((c) => !c || c === "none"), "mode icons must not stay clip-path blocks");
assert.equal(lobby.quickSvg, 2);
assert.ok(lobby.chipSvg >= 3, "wallet chips must become minted icons");
assert.equal(lobby.coinSvg, true);
assert.equal(lobby.navSvg, 5, "bottom nav must drop 寻册店关档 drafts");
assert.deepEqual(lobby.navKinds, ["gacha", "pal", "boutique", "stage", "archive"]);
assert.ok(lobby.navText.every((t) => !t || t.length === 0), "bottom nav must not keep character drafts");
await page.screenshot({ path: path.join(out, "01-lobby.png") });

const api = (method, ...args) => page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
await api("openDrawer", "shop");
await page.waitForSelector("#shopList .skinCard", { timeout: 8000 });
await page.evaluate(() => {
  window.SakurayoBoutique?.install?.();
  window.SakurayoChrome?.dress?.(document);
});
await page.waitForTimeout(200);

const shop = await page.evaluate(() => {
  return {
    title: document.querySelector("#shopDrawer .dhead h2")?.textContent || "",
    mark: !!document.querySelector("#shopDrawer .shopMark46 svg"),
    rail: document.querySelectorAll(".shopRailIco46 svg").length,
    chips: [...document.querySelectorAll("#shopDrawer .shopChip46 i svg")].length,
    hero: !!document.querySelector("#shopFeatured46 .shopSkin46"),
  };
});
assert.match(shop.title, /时装商店/);
assert.equal(shop.mark, true);
assert.equal(shop.rail, 3);
assert.ok(shop.chips >= 3);
await page.screenshot({ path: path.join(out, "02-window.png") });

await page.locator('[data-shop-rail="supplies"]').click();
await page.waitForTimeout(200);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const supplies = await page.evaluate(() => ({
  goods: document.querySelectorAll("#shopCounter46 .shopGoodIco46 svg").length,
  items: document.querySelectorAll("#shopDrawer .shopIcon40 svg").length,
}));
assert.equal(supplies.goods, 3);
assert.ok(supplies.items >= 3, "starter/item cards must drop emoji drafts");
await page.screenshot({ path: path.join(out, "03-supplies.png") });

await page.locator('[data-shop-rail="exchange"]').click();
await page.waitForTimeout(200);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const exchange = await page.evaluate(() => document.querySelectorAll("#shopExchange46 .shopGoodIco46 svg").length);
assert.ok(exchange >= 4, "exchange counter must use minted currency icons");
await page.screenshot({ path: path.join(out, "04-exchange.png") });

await page.evaluate(() => document.querySelector("#shopDrawer .close")?.click());
await api("openDrawer", "mission");
await page.waitForTimeout(200);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const mission = await page.evaluate(() => document.querySelectorAll("#missionDrawer .railIco46 svg, [id*=mission] .railIco46 svg, .shellDrawer46 .railIco46 svg").length);
await page.screenshot({ path: path.join(out, "05-mission.png") });
assert.ok(mission >= 3, "mission list must use minted task icons");

await page.evaluate(() => document.querySelector(".shellDrawer46:not(.hidden) .close, #missionDrawer .close")?.click());
await api("openDrawer", "profile");
await page.waitForTimeout(200);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const profile = await page.evaluate(() => ({
  gifts: document.querySelectorAll(".profileGift46 button svg").length,
  heart: !!document.querySelector(".profileBond46 > i svg"),
}));
await page.screenshot({ path: path.join(out, "06-profile.png") });
assert.equal(profile.gifts, 4, "profile gift buttons must drop 赠声衣 drafts");
assert.equal(profile.heart, true);

await page.locator('[data-profile-tab="talent"]').click();
await page.waitForTimeout(200);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const talent = await page.evaluate(() => document.querySelectorAll("#profileBody46 .shellItem46 > i svg").length);
await page.screenshot({ path: path.join(out, "07-talent.png") });
assert.ok(talent >= 4, "talent rows must drop ⚔♥✦ drafts");

await page.evaluate(() => document.querySelector("#profileDrawer .close")?.click());
await api("openDrawer", "calendar");
await page.waitForTimeout(200);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
await page.screenshot({ path: path.join(out, "08-calendar.png") });

await page.evaluate(() => document.querySelector("#calendarDrawer .close")?.click());
await api("openDrawer", "archive");
await page.waitForTimeout(200);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
await page.screenshot({ path: path.join(out, "09-archive.png") });

await page.evaluate(() => document.querySelector("#archiveDrawer .close")?.click());
await api("openDrawer", "gacha");
await page.waitForTimeout(300);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const gacha = await page.evaluate(() => document.querySelectorAll(".wishPills46 b svg").length);
await page.screenshot({ path: path.join(out, "10-gacha.png") });
assert.ok(gacha >= 2, "gacha wallet pills must drop circle/rect drafts");

await page.evaluate(() => document.querySelector("#gachaDrawer .close")?.click());
await api("openDrawer", "ach");
await page.waitForTimeout(300);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const ach = await page.evaluate(() => {
  const badges = [...document.querySelectorAll("#achDrawer .badge")];
  const leftover = badges.filter((el) => !el.querySelector("svg") && !el.querySelector("img") && /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test((el.textContent || "").trim()));
  return {
    svg: badges.filter((el) => el.querySelector("svg")).length,
    leftover: leftover.map((el) => (el.textContent || "").trim()),
    total: badges.length,
  };
});
await page.screenshot({ path: path.join(out, "11-achievements.png") });
assert.ok(ach.total >= 8, "achievement list must render badges");
assert.ok(ach.svg >= 6, "achievement badges must drop emoji drafts");
assert.equal(ach.leftover.length, 0, "no raw emoji badges left");

await page.evaluate(() => document.querySelector("#achDrawer .close")?.click());
await page.evaluate(() => document.querySelector("#guideButton37")?.click());
await page.waitForSelector("#tutorialDrawer37:not(.hidden) .tutorialIcon37", { timeout: 8000 });
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const tutorial = await page.evaluate(() => {
  const icon = document.querySelector(".tutorialIcon37");
  return {
    svg: !!icon?.querySelector("svg"),
    text: (icon?.textContent || "").trim(),
    kind: icon?.getAttribute("data-chrome") || "",
  };
});
await page.screenshot({ path: path.join(out, "12-tutorial.png") });
assert.equal(tutorial.svg, true, "tutorial hero icon must drop joystick/emoji draft");
assert.ok(!tutorial.text, "tutorial icon must not keep the emoji glyph");

await page.evaluate(() => document.querySelector("#tutorialDrawer37 .close")?.click());
await api("openDrawer", "talent");
await page.waitForTimeout(200);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const talentDrawer = await page.evaluate(() => document.querySelectorAll("#talentList .ticon svg").length);
await page.screenshot({ path: path.join(out, "13-talent-drawer.png") });
assert.ok(talentDrawer >= 4, "permanent talent icons must drop emoji drafts");

await page.evaluate(() => document.querySelector("#talentDrawer .close")?.click());
await api("openDrawer", "asc");
await page.waitForTimeout(200);
await page.evaluate(() => window.SakurayoChrome?.dress?.(document));
const asc = await page.evaluate(() => {
  const icons = [...document.querySelectorAll("#ascDrawer .storyIcon")];
  const leftover = icons.filter((el) => !el.querySelector("svg") && !el.querySelector("img") && /[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u2139]/u.test((el.textContent || "").trim()));
  return { svg: icons.filter((el) => el.querySelector("svg")).length, leftover: leftover.map((el) => (el.textContent || "").trim()) };
});
await page.screenshot({ path: path.join(out, "14-ascension.png") });
assert.ok(asc.svg >= 1, "ascension guide must mint the info/story icons");
assert.equal(asc.leftover.length, 0, "ascension story icons must not stay as emoji");

const extras = await page.evaluate(() => {
  const event = document.querySelector("#eventIcon");
  const result = document.querySelector("#ricon");
  event.textContent = "📡";
  result.textContent = "☠️";
  const box = document.querySelector("#choices");
  box.innerHTML = '<button class="choice"><img src="data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><text x="64" y="79" font-size="52" text-anchor="middle">⚡</text></svg>') +
    '"><div><b>疾风扳机</b></div></button>';
  const skin = document.createElement("div");
  skin.className = "skinPreview";
  skin.innerHTML = "<span>🎤</span>";
  document.body.appendChild(skin);
  window.SakurayoChrome.dress(document);
  return {
    event: { svg: !!event.querySelector("svg"), kind: event.getAttribute("data-chrome"), text: (event.textContent || "").trim() },
    result: { svg: !!result.querySelector("svg"), kind: result.getAttribute("data-chrome"), text: (result.textContent || "").trim() },
    choice: document.querySelector(".choice > img")?.getAttribute("data-chrome") || "",
    skin: { svg: !!skin.querySelector("svg"), kind: skin.querySelector("span")?.getAttribute("data-chrome") || "" },
    kinds: ["🕹️", "⚠️", "⚡", "👻", "🎤", "ℹ️", "📡", "☠️"].map((mark) => window.SakurayoChrome.kind(mark)),
  };
});
assert.equal(extras.event.svg, true);
assert.equal(extras.event.kind, "notice");
assert.equal(extras.result.svg, true);
assert.equal(extras.result.kind, "skull");
assert.equal(extras.choice, "bolt");
assert.equal(extras.skin.svg, true);
assert.equal(extras.skin.kind, "mic");
assert.deepEqual(extras.kinds, ["stick", "warn", "bolt", "ghost", "mic", "info", "notice", "skull"]);

await browser.close();
console.log("PASS chrome icons", JSON.stringify({ lobby, shop, supplies, exchange, mission, profile, talent, gacha, ach, tutorial, talentDrawer, asc, extras }), out);

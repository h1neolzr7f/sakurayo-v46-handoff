import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "tests/artifacts/shell");
fs.mkdirSync(out, { recursive: true });
const source = path.resolve(root, "src/index.html");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 932, height: 430 }, isMobile: true, hasTouch: true });
await page.addInitScript(() => {
  localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true, coins: 880 }));
});
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
await page.waitForTimeout(500);

const api = (method, ...args) => page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
const coinsOf = () =>
  page.locator("#coins").evaluate((el) => {
    const node = [...el.childNodes].find((n) => n.nodeType === 3);
    return Number(String((node && node.textContent) || el.textContent || "").replace(/[^\d-]/g, ""));
  });

assert.equal(await page.locator("#homeRail46 [data-home]").count(), 5);
assert.equal(await page.locator('#homeRail46 [data-home="mission"]').count(), 1);
assert.equal(await page.locator("#homePrism46").count(), 1);
assert.equal(await page.locator("#homeShard46").count(), 1);
assert.equal(await coinsOf(), 880);
assert.match(await page.locator("#homeBanner46").textContent(), /本期概率提升/);
assert.match(await page.locator("#homeBanner46").textContent(), /\d+天\d+时/);
assert.match(await page.locator("#homeTicket46").textContent(), /^\d+$/);
await page.screenshot({ path: path.join(out, "01-lobby.png") });

for (const name of ["mission", "mail", "notice", "friend", "calendar", "profile"]) {
  const opened = await api("openDrawer", name);
  assert.equal(opened.visible, true, name + " should open");
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, `02-${name}.png`) });
}
assert.match(await page.locator("#noticeBody46").textContent(), /通关记录沿用现有存档字段/);
assert.equal(await page.locator("#noticeBody46 .shellPane46").count(), 1);
assert.match(await page.locator("#friendDrawer").textContent(), /支援中|设为支援/);
assert.match(await page.locator("#friendButton46").textContent(), /支援名册/);
assert.match(await page.locator(".homeSupport46").textContent(), /支援/);

await api("openDrawer", "ach");
assert.equal(await page.locator("#achDrawer.achShell46").count(), 1);
await page.screenshot({ path: path.join(out, "02-ach.png") });
await api("openDrawer", "settings");
assert.equal(await page.locator("#settingsDrawer37.settingsShell46").count(), 1);
await page.screenshot({ path: path.join(out, "02-settings.png") });
await api("openDrawer", "stage");
assert.equal(await page.locator("#stageDrawer.stageShell46").count(), 1);
await page.screenshot({ path: path.join(out, "02-stage.png") });
await api("openDrawer", "archive");
assert.equal(await page.locator("#archiveStats46").count(), 1);
assert.match(await page.locator("#archiveStats46").textContent(), /主线通关/);
await page.screenshot({ path: path.join(out, "02-archive.png") });

assert.equal(await coinsOf(), 880);
await api("openDrawer", "calendar");
assert.match(await page.locator("#calendarDrawer").textContent(), /券/);
await page.locator(".shellCal46 button.on").click();
await page.waitForSelector(".shellStamp46");
await page.screenshot({ path: path.join(out, "02-calendar-stamp.png") });
assert.ok((await coinsOf()) > 880);
const raw = await page.evaluate(() => localStorage.getItem("sakurayoV3"));
assert.ok(raw);
assert.equal(JSON.parse(raw).prism, undefined);

await api("openDrawer", "gacha");
await page.waitForSelector("#gachaPull1", { timeout: 8000 });
assert.equal(await page.locator("#gachaPull1").count(), 1);
assert.equal(await page.locator("#gachaPull10").count(), 1);
assert.equal(await page.locator(".gachaBanners46 button").count(), 3);
await page.screenshot({ path: path.join(out, "03-gacha.png") });

await api("openDrawer", "roster");
await page.waitForSelector("#rosterWall46", { timeout: 8000 });
assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 16);
assert.equal(await page.locator(".rosterFilter46 button").count(), 4);
assert.equal(await page.locator('[data-roster-filter="main"]').count(), 1);
await page.screenshot({ path: path.join(out, "04-roster.png") });

await api("openDrawer", "shop");
await page.waitForSelector("#shopList .shopTabs40", { timeout: 8000 });
assert.equal(await page.locator("#shopList .shopTabs40 button").count(), 5);
assert.equal(await page.locator(".shopRail46 button").count(), 3);
assert.equal(await page.locator("#shopList .skinCard").count(), 11);
assert.equal(await page.locator("#shopFeatured46 .shopSkin46").count(), 1);
assert.match(await page.locator("#shopDrawer .dhead h2").textContent(), /时装商店/);
assert.match(await page.locator("#shopFeatured46").textContent(), /本期主推/);
assert.match(await page.locator("#shopList .shopPitch46").first().textContent(), /上场|剪影|咒语|刀|安可|好看|买单|开刃|观测|礼服|现货/);
assert.match(await page.locator("#shopPrism46").textContent(), /^\d+$/);
assert.match(await page.locator("#shopTicket46").textContent(), /^\d+$/);
await page.screenshot({ path: path.join(out, "05-shop.png") });
await page.locator('[data-shop-rail="supplies"]').click();
assert.equal(await page.locator("#shopCounter46 .shopGood46").count(), 3);
assert.match(await page.locator("#shopCounter46").textContent(), /寻访券/);
await page.screenshot({ path: path.join(out, "05-shop-supplies.png") });
await page.locator('[data-shop-rail="exchange"]').click();
assert.match(await page.locator("#shopExchange46").textContent(), /寻访券/);
await page.screenshot({ path: path.join(out, "05-shop-exchange.png") });

await api("openDrawer", "story");
await page.waitForSelector("#storyList", { timeout: 8000 });
assert.ok(await page.locator(".storyPane46").count() >= 1);
await page.screenshot({ path: path.join(out, "06-story.png") });

await api("openDrawer", "profile");
await page.waitForSelector("#profileBody46", { timeout: 8000 });
assert.ok(await page.locator(".profileGift46").count() >= 1);
await page.screenshot({ path: path.join(out, "07-profile.png") });

await page.evaluate(() => document.querySelectorAll(".drawer").forEach(n => n.classList.add("hidden")));
await api("start");
if (await page.locator("#tutorialDrawer37").isVisible()) {
  for (let i = 0; i < 4; i++) await page.locator("#tutorialNext37").click();
}
await api("dismissDialogue");
await api("protectPlayer");
await api("freezeProgression");
await page.waitForTimeout(400);
assert.equal(await page.locator("#dash").count(), 1);
assert.equal(await page.locator("#skill").count(), 1);
await page.screenshot({ path: path.join(out, "08-combat.png") });

await browser.close();
console.log("PASS shell visual", out);

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "src/index.html");
const out = path.join(root, "tests/artifacts/player");
fs.mkdirSync(out, { recursive: true });

function overlap(a, b) {
  if (!a || !b || a.w < 1 || a.h < 1 || b.w < 1 || b.h < 1) return 0;
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
}

function inView(box, vw, vh, pad = 2) {
  return !!box && box.w >= 8 && box.h >= 8 && box.x >= -pad && box.y >= -pad && box.x + box.w <= vw + pad && box.y + box.h <= vh + pad;
}

const coinsOf = (page) =>
  page.locator("#coins").evaluate((el) => {
    const node = [...el.childNodes].find((n) => n.nodeType === 3);
    return Number(String((node && node.textContent) || el.textContent || "").replace(/[^\d-]/g, ""));
  });

const browser = await chromium.launch({ headless: true });
const errors = [];

async function openPage(viewport, save) {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
  await context.addInitScript((raw) => {
    localStorage.setItem("sakurayoV3", raw);
  }, JSON.stringify(save));
  const page = await context.newPage();
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
  await page.waitForFunction(() => !document.getElementById("bootArt35") || document.getElementById("bootArt35").classList.contains("gone"), null, { timeout: 15000 });
  await page.waitForTimeout(450);
  return { context, page };
}

const api = (page, method, ...args) =>
  page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });

const boxesOf = (page, sels) =>
  page.evaluate((sels) => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return null;
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const out = { vw: innerWidth, vh: innerHeight };
    for (const [key, sel] of Object.entries(sels)) out[key] = box(document.querySelector(sel));
    return out;
  }, sels);

const { context, page } = await openPage({ width: 932, height: 430 }, { tutorialDone: true, coins: 880 });

assert.equal(await page.locator("#bootArt35").count(), 0, "boot overlay should be gone");
assert.equal(await page.locator("#homeCoinPlus46").count(), 1);
assert.equal(await coinsOf(page), 880);
assert.match(await page.locator("#homeGreet46").textContent(), /登录补给还在/);
assert.match(await page.locator("#homeBanner46").textContent(), /本期概率提升/);
assert.match(await page.locator("#homeBanner46").textContent(), /\d+天\d+时/);
assert.match(await page.locator("#homeTicket46").textContent(), /^\d+$/);

const lobby = await boxesOf(page, {
  start: "#start",
  nav: ".homeNav46",
  more: "#moreButton39",
  rail: "#homeRail46",
  notice: '#homeRail46 [data-home="notice"]',
  settings: '#homeRail46 [data-home="settings"]',
  banner: "#homeBanner46",
  cal: "#homeQuick46 .homeIco46.cal",
  profile: "#menu.homeDock46 .profile",
  chars: "#menu.homeDock46 .charSelectPanel",
});
assert.ok(lobby.notice && lobby.notice.h >= 42, "notice touch target");
assert.ok(lobby.settings && lobby.settings.h >= 42, "settings touch target");
assert.equal(overlap(lobby.rail, lobby.banner), 0, "rail must not cover banner");
assert.equal(overlap(lobby.notice, lobby.banner), 0, "notice must not sit under banner");
assert.equal(overlap(lobby.settings, lobby.banner), 0, "settings must not sit under banner");
assert.equal(overlap(lobby.start, lobby.nav), 0);
assert.equal(overlap(lobby.profile, lobby.chars), 0, "名牌不得盖住换角圆钮");
if (lobby.banner && lobby.nav) {
  assert.ok(lobby.banner.y + lobby.banner.h <= lobby.nav.y + 2, "寻访条须在底栏之上");
}
if (lobby.rail && lobby.banner) {
  assert.ok(lobby.rail.y + lobby.rail.h <= lobby.banner.y + 2, "左栏须停在寻访条上方");
}
await page.screenshot({ path: path.join(out, "01-lobby.png") });

await api(page, "openDrawer", "calendar");
assert.match(await page.locator("#calendarDrawer").textContent(), /券/);
const before = await coinsOf(page);
await page.locator('.shellCal46 button[data-login-day="7"]').click();
assert.equal(await coinsOf(page), before, "future day must not claim");
await page.locator(".shellCal46 button.on").click();
await page.waitForSelector(".shellStamp46");
assert.ok((await coinsOf(page)) > before);
assert.equal(await page.locator("#homeCoinPlus46").count(), 1, "+ must survive persist");
await page.screenshot({ path: path.join(out, "02-calendar-claim.png") });
await page.locator("#calendarDrawer .close").click();
assert.equal(await page.locator("#homeQuick46 .homeIco46.cal.hasDot46").count(), 0);

await api(page, "openDrawer", "mail");
assert.equal(await page.locator("#mailBody46 .shellPane46").count(), 1);
const mailBefore = await coinsOf(page);
await page.locator('#mailBody46 [data-id="welcome"]').click();
assert.ok((await coinsOf(page)) > mailBefore);
await page.locator("#mailDrawer .close").click();

await api(page, "openDrawer", "notice");
assert.match(await page.locator("#noticeBody46 .shellPane46").textContent(), /不联网拉取公告|不出售永久伤害/);
await page.locator("#noticeDrawer .close").click();

await api(page, "openDrawer", "friend");
await page.locator('[data-friend="aya"]').click();
assert.match(await page.locator(".homeSupport46").textContent(), /神代绫/);
await page.locator("#profileDrawer .close").click();

await api(page, "openDrawer", "profile");
await page.locator('[data-profile-tab="talent"]').click();
assert.match(await page.locator("#profileBody46").textContent(), /破魔弹芯|巫女护体/);
const giftBefore = await coinsOf(page);
await page.locator('.profileGift46 [data-gift="give"]').click();
assert.equal(await coinsOf(page), giftBefore - 40);
await page.locator("#profileDrawer .close").click();

await api(page, "openDrawer", "shop");
await page.waitForSelector("#shopFeatured46");
assert.equal(await page.locator("#shopList .skinCard").count(), 11);
assert.match(await page.locator("#shopDrawer .dhead h2").textContent(), /时装商店/);
assert.match(await page.locator("#shopTicket46").textContent(), /^\d+$/);
await page.locator('[data-shop-rail="supplies"]').click();
assert.equal(await page.locator("#shopCounter46 .shopGood46").count(), 3);
const shopBefore = await coinsOf(page);
const ticketBefore = Number(await page.locator("#homeTicket46").textContent());
await page.locator('#shopCounter46 [data-shop-buy="starter:assault"] button').click();
assert.ok((await coinsOf(page)) < shopBefore, "featured core must spend coins");
await page.locator('#shopCounter46 [data-shop-buy="exchange:coin-ticket"] button').click();
assert.ok(Number(await page.locator("#homeTicket46").textContent()) > ticketBefore, "featured ticket must credit");
await page.locator("#shopDrawer .close").click();

await api(page, "grantCheat46");
await api(page, "openDrawer", "gacha");
await page.waitForSelector("#gachaPull1");
assert.match(await page.locator("#gachaDrawer").textContent(), /结束时间：\d+天\d+时/);
assert.match(await page.locator("#gachaDrawer").textContent(), /本期概率提升|常规均权/);
assert.match(await page.locator("#gachaDrawer").textContent(), /寻访券/);
assert.match(await page.locator("#gachaDrawer").textContent(), /当前能量：\d+\/50/);
await page.locator("#gachaPull1").click();
await page.waitForSelector("#gachaReveal46.isDone");
assert.match(await page.locator("#gachaReveal46").textContent(), /镜界开印/);
assert.match(await page.locator("#gachaReveal46").textContent(), /收下证词/);
await page.locator(".revealTake46").click();
assert.equal(await page.locator("#gachaReveal46").count(), 0);

await page.locator("#gachaPull10").click();
await page.waitForSelector("#gachaReveal46.isDone");
const ten = await boxesOf(page, {
  head: ".revealHead46",
  grid: ".revealGrid46",
  sum: ".revealSum46",
  take: ".revealTake46",
  skip: ".revealSkip46",
  again: ".revealAgain46",
});
assert.equal(await page.locator("#gachaReveal46 .revealCard46").count(), 10);
assert.ok(inView(ten.take, ten.vw, ten.vh), "ten-pull take must stay in viewport");
assert.ok(inView(ten.skip, ten.vw, ten.vh), "ten-pull skip must stay in viewport");
assert.ok(inView(ten.again, ten.vw, ten.vh), "ten-pull again must stay in viewport");
assert.ok(inView(ten.grid, ten.vw, ten.vh, 8), "ten-pull grid must stay in viewport");
await page.screenshot({ path: path.join(out, "03-reveal-ten.png") });
await page.locator(".revealTake46").click();
await page.locator("#gachaDrawer .close").click();

await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));
await api(page, "start");
if (await page.locator("#tutorialDrawer37").isVisible()) {
  const skip = page.locator("#tutorialSkip37");
  if (await skip.count()) await skip.click({ force: true });
  else for (let i = 0; i < 4; i++) await page.locator("#tutorialNext37").click({ force: true });
}
await api(page, "dismissDialogue");
await api(page, "protectPlayer");
await api(page, "freezeProgression");
await page.waitForTimeout(300);
assert.equal(await page.locator(".shellFloat46").count(), 0, "login float must not enter combat");
const toastText = (await page.locator("#toast").textContent()) || "";
assert.doesNotMatch(toastText, /还没到这一天|今天已经领过了|第\d+日|邮件签收|好感 \+80|任务 \+/);
assert.equal(await page.locator("#joy").count(), 1);
assert.equal(await page.locator("#dash").count(), 1);
assert.equal(await page.locator("#skill").count(), 1);
await page.screenshot({ path: path.join(out, "04-combat.png") });
await context.close();

const short = await openPage({ width: 866, height: 287 }, { tutorialDone: true, coins: 20000 });
await api(short.page, "openDrawer", "gacha");
await short.page.waitForSelector("#gachaPull10");
await short.page.locator("#gachaPull10").click();
await short.page.waitForSelector("#gachaReveal46.isDone");
const shortTen = await boxesOf(short.page, {
  take: ".revealTake46",
  skip: ".revealSkip46",
  again: ".revealAgain46",
  grid: ".revealGrid46",
});
assert.ok(inView(shortTen.take, shortTen.vw, shortTen.vh, 4), "short ten-pull take in view");
assert.ok(inView(shortTen.skip, shortTen.vw, shortTen.vh, 4), "short ten-pull skip in view");
assert.ok(inView(shortTen.grid, shortTen.vw, shortTen.vh, 10), "short ten-pull grid in view");
await short.page.screenshot({ path: path.join(out, "05-short-ten.png") });
await short.context.close();

const old = await openPage({ width: 932, height: 430 }, { tutorialDone: true, coins: 12 });
assert.equal(await old.page.locator("#homePrism46").textContent(), "80");
assert.equal(await old.page.locator("#homeShard46").textContent(), "40");
assert.equal(await old.page.locator("#homeTicket46").textContent(), "1");
assert.equal(await coinsOf(old.page), 12);
await old.context.close();

await browser.close();
const real = errors.filter((e) => !/favicon|net::ERR/i.test(e));
assert.equal(real.length, 0, real.join("\n"));
console.log("PASS player path", out);

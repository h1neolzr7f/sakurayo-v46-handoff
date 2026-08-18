import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const fallback = path.join(
      os.homedir(),
      ".codex",
      "skills",
      "develop-web-game",
      "scripts",
      "node_modules",
      "playwright",
      "index.mjs",
    );
    return await import(pathToFileURL(fallback).href);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "src/index.html");
const out = path.join(root, "tests/artifacts/mobile-ux");
fs.mkdirSync(out, { recursive: true });

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 915, height: 412 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 SakurayoAndroid/4.7.0-yeying",
});
await context.addInitScript(() => {
  window.__SAKURAYO_ANDROID_LANDSCAPE__ = true;
  localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true, coins: 880 }));
});
const page = await context.newPage();
await page.goto(`${pathToFileURL(source).href}?test=1`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, {
  timeout: 30000,
});
await page.waitForFunction(
  () => !document.getElementById("bootArt35") || document.getElementById("bootArt35").classList.contains("gone"),
  null,
  { timeout: 15000 },
);
await page.waitForTimeout(400);

const lobby = await page.evaluate(() => {
  const start = document.getElementById("start");
  const greet = document.getElementById("homeGreet46");
  const pass = start && start.querySelector(".pass53");
  const r = start.getBoundingClientRect();
  const corners = [
    [r.x + 8, r.y + 8],
    [r.x + r.width / 2, r.y + r.height / 2],
    [r.x + r.width - 8, r.y + r.height - 8],
  ].map(([x, y]) => {
    const top = document.elementFromPoint(x, y);
    return {
      x: Math.round(x),
      y: Math.round(y),
      id: top && top.id,
      ok: !!(top && (top === start || start.contains(top))),
    };
  });
  const gs = greet && getComputedStyle(greet);
  const ps = pass && getComputedStyle(pass);
  return {
    clip: getComputedStyle(start).clipPath,
    deckPe: getComputedStyle(document.getElementById("homeDeck46") || start.parentElement).pointerEvents,
    startPe: getComputedStyle(start).pointerEvents,
    greetDisplay: gs ? gs.display : "missing",
    greetPe: gs ? gs.pointerEvents : "missing",
    passDisplay: ps ? ps.display : "missing",
    bannerDisplay: getComputedStyle(document.getElementById("homeBanner46") || document.body).display,
    corners,
    calendarHidden: !document.getElementById("calendarDrawer") || document.getElementById("calendarDrawer").classList.contains("hidden"),
  };
});

assert.match(lobby.clip, /none/);
assert.equal(lobby.deckPe, "none");
assert.equal(lobby.startPe, "auto");
assert.equal(lobby.greetDisplay, "none");
assert.ok(lobby.passDisplay === "none" || lobby.passDisplay === "missing");
assert.equal(lobby.bannerDisplay, "none", "412px 高须藏左下寻访条，避免和左栏底栏抢位");
assert.equal(lobby.calendarHidden, true);
assert.ok(
  lobby.corners.every((c) => c.ok),
  `出击斜角必须点到按钮 ${JSON.stringify(lobby.corners)}`,
);
await page.screenshot({ path: path.join(out, "01-lobby.png"), fullPage: true });

await page.locator("#homeQuick46 .homeIco46.cal").tap({ timeout: 8000 }).catch(() =>
  page.locator("#homeQuick46 .homeIco46.cal").click({ force: true }),
);
await page.waitForSelector("#calendarDrawer:not(.hidden)", { timeout: 8000 });
const cal = await page.evaluate(() => {
  const close = document.querySelector("#calendarDrawer .close");
  const on = document.querySelector("#calendarDrawer button.on");
  const cr = close && close.getBoundingClientRect();
  return {
    title: document.querySelector("#calendarDrawer h2")?.textContent,
    close: close && { w: cr.width, h: cr.height, pe: getComputedStyle(close).pointerEvents },
    claim: on && on.textContent.replace(/\s+/g, " ").trim(),
  };
});
assert.match(cal.title || "", /登录日历/);
assert.ok(cal.close && cal.close.w >= 40 && cal.close.h >= 40);
assert.equal(cal.close.pe, "auto");
assert.match(cal.claim || "", /领取/);
await page.screenshot({ path: path.join(out, "02-calendar.png"), fullPage: true });
await page.locator("#calendarDrawer .close").tap({ timeout: 6000 }).catch(() =>
  page.locator("#calendarDrawer .close").click({ force: true }),
);
await page.waitForFunction(() => document.getElementById("calendarDrawer")?.classList.contains("hidden"), null, {
  timeout: 6000,
});

const api = (method, ...args) =>
  page.evaluate(
    ({ method, args }) => {
      const out = window.__SAKURAYO_TEST__[method](...args);
      try {
        return JSON.parse(JSON.stringify(out));
      } catch {
        return { mode: out && out.mode };
      }
    },
    { method, args },
  );

const inView = (box, vw = 915, vh = 412, pad = 2) =>
  !!box && box.w >= 8 && box.h >= 8 && box.x >= -pad && box.y >= -pad && box.x + box.w <= vw + pad && box.y + box.h <= vh + pad;

await api("grantCheat46");
await api("openDrawer", "gacha");
await page.waitForSelector("#gachaDrawer:not(.hidden) #gachaPull1", { timeout: 8000 });
const gacha = await page.evaluate(() => {
  const one = document.getElementById("gachaPull1");
  const close = document.querySelector("#gachaDrawer .close");
  const r = one.getBoundingClientRect();
  const corners = [
    [r.x + 8, r.y + 8],
    [r.x + r.width / 2, r.y + r.height / 2],
    [r.x + r.width - 8, r.y + r.height - 8],
  ].map(([x, y]) => {
    const top = document.elementFromPoint(x, y);
    return { ok: !!(top && (top === one || one.contains(top))) };
  });
  return {
    clip: getComputedStyle(one).clipPath,
    close: close && { w: close.getBoundingClientRect().width, h: close.getBoundingClientRect().height },
    corners,
  };
});
assert.match(gacha.clip, /none/, "矮横屏寻访键不得斜切掉四角");
assert.ok(gacha.corners.every((c) => c.ok), `寻访单抽四角必须点到按钮 ${JSON.stringify(gacha.corners)}`);
assert.ok(gacha.close && gacha.close.w >= 40 && gacha.close.h >= 40);
await page.screenshot({ path: path.join(out, "05-gacha.png"), fullPage: true });
await api("pullGacha46", 1);
await page.waitForSelector("#gachaReveal46 .revealTake46", { timeout: 8000 });
const reveal = await page.evaluate(() => {
  const take = document.querySelector(".revealTake46");
  const skip = document.querySelector(".revealSkip46");
  const r = take.getBoundingClientRect();
  const ts = getComputedStyle(take);
  const ss = skip && getComputedStyle(skip);
  return {
    take: { x: r.x, y: r.y, w: r.width, h: r.height, image: ts.backgroundImage, color: ts.color },
    skip: skip && { bg: ss.backgroundColor, color: ss.color, w: skip.getBoundingClientRect().width, h: skip.getBoundingClientRect().height },
    cardH: document.querySelector(".revealCard46")?.getBoundingClientRect().height || 0,
  };
});
assert.ok(inView(reveal.take), `收下证词必须完整在视口内 ${JSON.stringify(reveal.take)}`);
assert.match(reveal.take.image, /linear-gradient|rgb\(255/, "收下证词必须有实心底");
assert.ok(reveal.skip && reveal.skip.w >= 64 && reveal.skip.h >= 36);
assert.doesNotMatch(reveal.skip.bg, /rgba\(255, 255, 255, 0\.0?6/);
assert.ok(reveal.cardH <= 200, `单抽卡不得撑破 412px 高 ${reveal.cardH}`);
await page.screenshot({ path: path.join(out, "06-reveal.png"), fullPage: true });
await page.locator(".revealTake46").tap({ timeout: 6000 }).catch(() => page.locator(".revealTake46").click({ force: true }));
await page.waitForFunction(() => !document.getElementById("gachaReveal46"), null, { timeout: 6000 });
await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));

await api("openDrawer", "shop");
await page.waitForSelector("#shopDrawer:not(.hidden)", { timeout: 8000 });
const shop = await page.evaluate(() => {
  const close = document.querySelector("#shopDrawer .close");
  const buy = document.querySelector("#shopDrawer button:not(.close)");
  const cr = close.getBoundingClientRect();
  const br = buy && buy.getBoundingClientRect();
  return {
    title: document.querySelector("#shopDrawer h2")?.textContent,
    close: { w: cr.width, h: cr.height, pe: getComputedStyle(close).pointerEvents },
    buy: buy && { w: br.width, h: br.height, text: buy.textContent.replace(/\s+/g, " ").trim().slice(0, 24) },
  };
});
assert.match(shop.title || "", /商店|时装/);
assert.ok(shop.close.w >= 40 && shop.close.h >= 40);
assert.equal(shop.close.pe, "auto");
assert.ok(shop.buy && shop.buy.w >= 64 && shop.buy.h >= 36, "商店购买钮够点");
await page.screenshot({ path: path.join(out, "07-shop.png"), fullPage: true });
await page.locator("#shopDrawer .close").tap({ timeout: 6000 }).catch(() =>
  page.locator("#shopDrawer .close").click({ force: true }),
);

await api("openDrawer", "roster");
await page.waitForSelector("#rosterDrawer:not(.hidden)", { timeout: 8000 });
const roster = await page.evaluate(() => {
  const close = document.querySelector("#rosterDrawer .close");
  const card = document.querySelector(".rosterSlot46");
  const cr = close.getBoundingClientRect();
  return {
    close: { w: cr.width, h: cr.height },
    card: card && { w: card.getBoundingClientRect().width, h: card.getBoundingClientRect().height },
  };
});
assert.ok(roster.close.w >= 40 && roster.close.h >= 40);
await page.screenshot({ path: path.join(out, "08-roster.png"), fullPage: true });
await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));

await api("selectCharacter", "sayo");
await api("selectStage", 1);
const started = await api("start");
if (started.mode === "dialogue") await api("dismissDialogue");
assert.equal((await page.evaluate(() => JSON.parse(window.render_game_to_text()).mode)), "play");

const combat = await page.evaluate(() => {
  const box = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height, x: r.x, y: r.y, pe: getComputedStyle(el).pointerEvents };
  };
  return {
    joy: box("joy"),
    dash: box("dash"),
    skill: box("skill"),
    pause: box("pause"),
    perfDisplay: getComputedStyle(document.getElementById("perf") || document.body).display,
    overlayBlur: getComputedStyle(document.getElementById("paused")).backdropFilter || getComputedStyle(document.getElementById("level")).backdropFilter,
  };
});
assert.ok(combat.dash && combat.dash.w >= 44 && combat.dash.h >= 44, "冲刺够点");
assert.ok(combat.skill && combat.skill.w >= 44 && combat.skill.h >= 44, "技能够点");
assert.ok(combat.pause && combat.pause.w >= 36 && combat.pause.h >= 36, "暂停够点");
assert.ok(combat.joy && combat.joy.w >= 64 && combat.joy.h >= 64, "摇杆可见");
assert.equal(combat.perfDisplay, "none", "矮横屏藏画质角标减 HUD 负担");
await page.screenshot({ path: path.join(out, "09-combat.png"), fullPage: true });

await api("protectPlayer");
await api("freezeProgression");
const leveled = await api("triggerUpgrade");
if (leveled.mode === "level" || !(await page.evaluate(() => document.getElementById("level")?.classList.contains("hidden")))) {
  await page.waitForSelector("#level:not(.hidden) #reroll", { timeout: 6000 });
  const level = await page.evaluate(() => {
    const reroll = document.getElementById("reroll");
    const choice = document.querySelector("#choices .choice");
    const banter = document.getElementById("banter");
    const rs = getComputedStyle(reroll);
    const rr = reroll.getBoundingClientRect();
    const cr = choice && choice.getBoundingClientRect();
    return {
      reroll: { x: rr.x, y: rr.y, w: rr.width, h: rr.height, bg: rs.backgroundColor, color: rs.color },
      choice: choice && { x: cr.x, y: cr.y, w: cr.width, h: cr.height },
      banterHidden: !banter || banter.classList.contains("hidden") || getComputedStyle(banter).visibility === "hidden" || Number(getComputedStyle(banter).opacity) === 0,
    };
  });
  assert.ok(inView(level.reroll), `重抽必须完整在视口内 ${JSON.stringify(level.reroll)}`);
  assert.ok(level.choice && inView(level.choice), `升级选项必须完整在视口内 ${JSON.stringify(level.choice)}`);
  assert.doesNotMatch(level.reroll.bg, /rgba\(255, 255, 255, 0\.0?6/);
  assert.match(level.reroll.color, /rgb\(255, 231, 163\)|rgb\(255, 255, 255\)/);
  assert.equal(level.banterHidden, true, "升级模态须收起吐槽电台");
  await page.screenshot({ path: path.join(out, "10-upgrade.png"), fullPage: true });
  await api("chooseUpgrade", 0);
}

await page.locator("#pause").tap({ timeout: 6000 }).catch(() => page.locator("#pause").click({ force: true }));
await page.waitForSelector("#paused:not(.hidden) #resume", { timeout: 6000 });
const pause = await page.evaluate(() => {
  const resume = document.getElementById("resume");
  const quit = document.getElementById("quit");
  const cs = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      bg: s.backgroundColor,
      image: s.backgroundImage,
      w: r.width,
      h: r.height,
      color: s.color,
    };
  };
  return {
    resume: cs(resume),
    quit: cs(quit),
    splash: document.querySelector("#paused .modal")?.classList.contains("outfitSplash45") || false,
    bgImage: document.querySelector("#paused .modal")?.style.backgroundImage || "",
    modalOpacity: getComputedStyle(document.querySelector("#paused .modal")).opacity,
  };
});
assert.equal(pause.splash, false, "矮横屏暂停不得铺闪图");
assert.equal(pause.bgImage, "");
assert.equal(pause.modalOpacity, "1", "暂停卡不得停在透明帧");
assert.ok(pause.resume.w >= 80 && pause.resume.h >= 36, "继续迎击够点");
assert.ok(pause.quit.w >= 80 && pause.quit.h >= 36, "返回主界面够点");
assert.doesNotMatch(pause.quit.bg, /rgba\(255, 255, 255, 0\.0?6/);
assert.match(pause.quit.color, /rgb\(255, 231, 163\)|rgb\(255, 255, 255\)/);
assert.match(pause.resume.image, /linear-gradient|rgb\(255/, "继续迎击必须有实心底");
await page.screenshot({ path: path.join(out, "03-pause.png"), fullPage: true });
await page.locator("#resume").tap({ timeout: 6000 }).catch(() => page.locator("#resume").click({ force: true }));

await api("protectPlayer");
await api("spawnBossNow");
if ((await page.evaluate(() => JSON.parse(window.render_game_to_text()).mode)) === "dialogue") {
  await api("dismissDialogue");
}
await api("defeatBoss");
await page.waitForTimeout(300);
if ((await page.evaluate(() => JSON.parse(window.render_game_to_text()).mode)) === "dialogue") {
  await api("dismissDialogue");
}
await page.waitForSelector("#result:not(.hidden) #back", { timeout: 8000 });
const result = await page.evaluate(() => {
  const back = document.getElementById("back");
  const again = document.getElementById("again");
  const stats = document.getElementById("rstats");
  const report = document.getElementById("damageReport");
  const s = getComputedStyle(back);
  const r = back.getBoundingClientRect();
  const ss = stats && getComputedStyle(stats);
  const rs = report && getComputedStyle(report);
  return {
    backBg: s.backgroundColor,
    backColor: s.color,
    w: r.width,
    h: r.height,
    againW: again.getBoundingClientRect().width,
    splash: document.querySelector("#result .modal")?.classList.contains("outfitSplash45") || false,
    bgImage: document.querySelector("#result .modal")?.style.backgroundImage || "",
    overlayBlur: getComputedStyle(document.getElementById("result")).backdropFilter,
    statsBg: ss ? ss.backgroundColor : "",
    statsColor: ss ? ss.color : "",
    reportBg: rs ? rs.backgroundColor : "",
    reportColor: rs ? rs.color : "",
  };
});
assert.ok(result.w >= 80 && result.h >= 36);
assert.ok(result.againW >= 80);
assert.doesNotMatch(result.backBg, /rgba\(255, 255, 255, 0\.0?6/);
assert.match(result.backColor, /rgb\(255, 231, 163\)|rgb\(255, 255, 255\)/);
assert.match(result.backBg, /rgb\(42, 24, 72\)|rgba\(42, 24, 72/);
assert.equal(result.splash, false, "矮横屏结算不得铺闪图压暗诊断");
assert.equal(result.bgImage, "");
assert.match(result.overlayBlur, /none|^$/);
assert.doesNotMatch(result.statsBg, /rgba\(255, 255, 255, 0\.0?3|rgba\(0, 0, 0, 0\)/);
assert.match(result.statsColor, /rgb\(255, 244, 228\)|rgb\(255, 231, 163\)|rgb\(255, 255, 255\)/);
assert.match(result.reportColor, /rgb\(255, 244, 228\)|rgb\(255, 231, 163\)|rgb\(255, 255, 255\)/);
await page.screenshot({ path: path.join(out, "04-result.png"), fullPage: true });

await browser.close();
console.log("PASS mobile ux", out);

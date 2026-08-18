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
    corners,
    calendarHidden: !document.getElementById("calendarDrawer") || document.getElementById("calendarDrawer").classList.contains("hidden"),
  };
});

assert.match(lobby.clip, /none/);
assert.equal(lobby.deckPe, "none");
assert.equal(lobby.startPe, "auto");
assert.equal(lobby.greetDisplay, "none");
assert.equal(lobby.passDisplay, "none");
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

await api("selectCharacter", "sayo");
await api("selectStage", 1);
const started = await api("start");
if (started.mode === "dialogue") await api("dismissDialogue");
assert.equal((await page.evaluate(() => JSON.parse(window.render_game_to_text()).mode)), "play");

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
  const s = getComputedStyle(back);
  const r = back.getBoundingClientRect();
  return {
    backBg: s.backgroundColor,
    backColor: s.color,
    w: r.width,
    h: r.height,
    againW: again.getBoundingClientRect().width,
  };
});
assert.ok(result.w >= 80 && result.h >= 36);
assert.ok(result.againW >= 80);
assert.doesNotMatch(result.backBg, /rgba\(255, 255, 255, 0\.0?6/);
assert.match(result.backColor, /rgb\(255, 231, 163\)|rgb\(255, 255, 255\)/);
assert.match(result.backBg, /rgb\(42, 24, 72\)|rgba\(42, 24, 72/);
await page.screenshot({ path: path.join(out, "04-result.png"), fullPage: true });

await browser.close();
console.log("PASS mobile ux", out);

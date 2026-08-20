import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "tests/artifacts/real");
fs.mkdirSync(out, { recursive: true });
const source = path.resolve(root, "src/index.html");
const url = `${pathToFileURL(source).href}?test=1`;
const viewport = { width: 932, height: 430 };

const api = (page, method, ...args) =>
  page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });

async function dump(page, name) {
  const info = await page.evaluate(() => {
    const q = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        hidden: el.classList.contains("hidden") || s.display === "none" || s.visibility === "hidden",
        box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        bg: (s.backgroundImage || "").slice(0, 220),
        bgSize: s.backgroundSize,
        bgPos: s.backgroundPosition,
        overflow: s.overflow + "/" + s.overflowY,
      };
    };
    return {
      size: { iw: innerWidth, ih: innerHeight, dpr: devicePixelRatio },
      htmlClass: document.documentElement.className,
      state: typeof window.render_game_to_text === "function" ? JSON.parse(window.render_game_to_text()) : null,
      menu: q("#menu"),
      menuBg: q("#menu .bg"),
      hud: q("#hud"),
      dialogue: q("#dialogue"),
      dialogueArt: q(".dialogueArt"),
      dialogueModal: q("#dialogue .dialogueModal"),
      level: q("#level"),
      paused: q("#paused"),
      ops: q("#opsDock46"),
      talent: q("#talentDrawer"),
      shop: q("#shopDrawer"),
      tutorial: q("#tutorialDrawer37"),
      radio: q("#radio"),
    };
  });
  fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(info, null, 2));
  return info;
}

async function shot(page, name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: false });
  const info = await dump(page, name);
  console.log("SHOT", name, info.state?.state || info.htmlClass, info.dialogueArt?.box || "", info.level?.box || "");
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
await page.waitForTimeout(900);

await api(page, "selectCharacter", "sayo");
await page.waitForTimeout(400);
await shot(page, "01-lobby-sayo");

await api(page, "selectCharacter", "aya");
await page.waitForTimeout(400);
await shot(page, "02-lobby-aya");

await api(page, "selectCharacter", "rion");
await page.waitForTimeout(400);
await shot(page, "03-lobby-rion");

await api(page, "selectCharacter", "sayo");
await api(page, "openDrawer", "talent");
await page.waitForTimeout(400);
await shot(page, "04-talent");

await api(page, "openDrawer", "shop");
await page.waitForTimeout(400);
await shot(page, "05-shop");

await page.evaluate(() => {
  const d = document.getElementById("shopDrawer");
  if (d) d.classList.add("hidden");
  const t = document.getElementById("talentDrawer");
  if (t) t.classList.add("hidden");
});

// First start may open tutorial
await api(page, "start");
await page.waitForTimeout(500);
const tutorialOpen = await page.evaluate(() => {
  const d = document.getElementById("tutorialDrawer37");
  return !!(d && !d.classList.contains("hidden"));
});
if (tutorialOpen) {
  await shot(page, "06-tutorial");
  await page.evaluate(() => {
    const skip = document.getElementById("tutorialSkip37");
    if (skip) skip.click();
    else {
      const close = document.querySelector("#tutorialDrawer37 .close");
      if (close) close.click();
    }
  });
  await page.waitForTimeout(300);
  await api(page, "start");
  await page.waitForTimeout(700);
}

await page.waitForFunction(() => {
  const art = document.querySelector(".dialogueArt");
  const bg = art && getComputedStyle(art).backgroundImage;
  return !!(bg && bg.includes("webp"));
}, null, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(400);
await shot(page, "07-dialogue-sayo");
await page.evaluate(() => document.getElementById("dialogue")?.click());
await page.waitForTimeout(350);
await shot(page, "07b-dialogue-sayo-self");

await api(page, "dismissDialogue");
await page.waitForTimeout(200);
await api(page, "protectPlayer");
await api(page, "freezeProgression");
await page.evaluate(() => {
  if (typeof window.advanceTime === "function") window.advanceTime(10000);
});
await page.waitForTimeout(200);
await shot(page, "08-combat-10s");

const combat = await page.evaluate(() => {
  const snap = typeof window.render_game_to_text === "function" ? JSON.parse(window.render_game_to_text()) : {};
  return {
    state: snap.state,
    enemies: snap.enemies,
    runTime: snap.runTime,
    ops: document.getElementById("opsDock46")
      ? getComputedStyle(document.getElementById("opsDock46")).display
      : "missing",
  };
});
fs.writeFileSync(path.join(out, "08-combat-10s.meta.json"), JSON.stringify(combat, null, 2));
console.log("COMBAT", combat);

const combatLive = await page.evaluate(() => {
  const snap = typeof window.render_game_to_text === "function" ? JSON.parse(window.render_game_to_text()) : {};
  return {
    enemies: snap.counts?.enemies,
    onScreen: snap.counts?.enemies,
    runTime: snap.runTime,
    player: snap.player && { x: snap.player.x, y: snap.player.y },
  };
});
console.log("COMBAT_LIVE", combatLive);

await api(page, "protectPlayer");
await api(page, "triggerUpgrade");
await page.waitForTimeout(400);
await shot(page, "09-upgrade");

await api(page, "chooseUpgrade", 0);
await page.waitForTimeout(200);
await api(page, "protectPlayer");
await api(page, "pauseNow");
await page.waitForTimeout(300);
await shot(page, "10-pause");

await api(page, "backMenu");
await api(page, "selectCharacter", "aya");
await api(page, "start");
await page.waitForTimeout(700);
await shot(page, "11-dialogue-aya");

await api(page, "backMenu");
await api(page, "selectCharacter", "rion");
await api(page, "start");
await page.waitForTimeout(700);
await shot(page, "12-dialogue-rion");

await browser.close();
console.log("DONE", out);

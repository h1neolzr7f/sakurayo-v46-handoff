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
const out = path.join(root, "tests/artifacts/mobile");
fs.mkdirSync(out, { recursive: true });

const PIXEL7_LANDSCAPE = { width: 915, height: 412 };
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 SakurayoAndroid/4.7.0-yeying";

function overlap(a, b) {
  if (!a || !b || a.w < 1 || a.h < 1 || b.w < 1 || b.h < 1) return 0;
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
}

const { chromium } = await loadPlaywright();
const errors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: PIXEL7_LANDSCAPE,
  isMobile: true,
  hasTouch: true,
  userAgent: ANDROID_UA,
});
await context.addInitScript(() => {
  window.__SAKURAYO_ANDROID_LANDSCAPE__ = true;
});
const page = await context.newPage();
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(`${pathToFileURL(source).href}?test=1`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForFunction(
  () => window.__SAKURAYO_TEST__ && document.getElementById("start"),
  null,
  { timeout: 30000 },
);
await page.waitForFunction(
  () => !document.getElementById("bootArt35") || document.getElementById("bootArt35").classList.contains("gone"),
  null,
  { timeout: 15000 },
);
await page.waitForTimeout(400);

const api = (method, ...args) =>
  page.evaluate(({ method, args }) => {
    const out = window.__SAKURAYO_TEST__[method](...args);
    try {
      return JSON.parse(JSON.stringify(out));
    } catch {
      return { mode: out && out.mode, runMode: out && out.runMode, ok: out && out.ok, reason: out && out.reason };
    }
  }, { method, args });
const snap = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const shot = (name) => page.screenshot({ path: path.join(out, name), fullPage: true });

async function tap(sel, label = sel, min = 28) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 12000 });
  const box = await loc.boundingBox();
  assert.ok(box, `${label} must have a box`);
  assert.ok(box.width >= min && box.height >= min, `${label} touch target ${box.width}x${box.height}`);
  await loc.tap({ timeout: 8000 }).catch(() => loc.click({ force: true }));
}

async function closeDrawer(id) {
  const drawer = page.locator(id);
  if (!(await drawer.isVisible().catch(() => false))) return;
  const closer = page.locator(`${id} .close`);
  if (await closer.count()) await closer.tap({ timeout: 6000 }).catch(() => closer.click({ force: true }));
  await page.waitForTimeout(180);
}

const boxesOf = (sels) =>
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

assert.ok(await page.evaluate(() => document.documentElement.classList.contains("landscape46")));
assert.equal(await page.evaluate(() => document.documentElement.classList.contains("portraitFallback46")), false);
assert.equal(await page.locator("#rotateHint46").isVisible(), false);

const lobby = await boxesOf({
  start: "#start",
  nav: ".homeNav46",
  chars: "#menu.homeDock46 .charSelectPanel",
  wallet: ".homeWallet46",
  more: "#moreButton39",
  rail: "#homeRail46",
});
assert.ok(lobby.start && lobby.start.w >= 88 && lobby.start.h >= 42, "出击按钮够大");
assert.equal(overlap(lobby.start, lobby.nav), 0, "出击不得被底栏盖住");
assert.equal(overlap(lobby.chars, lobby.wallet), 0, "换角不得压钱包");
const startHits = await page.evaluate(() => {
  const start = document.getElementById("start");
  const r = start.getBoundingClientRect();
  return [
    [r.x + 8, r.y + 8],
    [r.x + r.width - 8, r.y + r.height - 8],
  ].every(([x, y]) => {
    const top = document.elementFromPoint(x, y);
    return top && (top === start || start.contains(top));
  });
});
assert.equal(startHits, true, "出击斜角必须点到按钮");
assert.equal(
  await page.evaluate(() => getComputedStyle(document.getElementById("homeGreet46") || document.body).display),
  "none",
);
await shot("01-lobby.png");

await tap('#homeRail46 [data-home="settings"]', "settings");
assert.ok(await page.locator("#settingsDrawer37:not(.hidden)").isVisible());
await closeDrawer("#settingsDrawer37");

await tap(".homeNav46 [data-open='gacha']", "gacha");
await page.waitForSelector("#gachaDrawer:not(.hidden)", { timeout: 8000 });
await shot("02-gacha.png");
await closeDrawer("#gachaDrawer");

await tap(".homeNav46 [data-open='shop']", "shop");
await page.waitForSelector("#shopDrawer:not(.hidden)", { timeout: 8000 });
assert.match(await page.locator("#shopDrawer .dhead h2").textContent(), /时装商店|商店/);
await shot("03-shop.png");
await closeDrawer("#shopDrawer");

await tap(".homeNav46 [data-open='stage']", "stage");
await page.waitForSelector("#stageDrawer:not(.hidden), #stageList", { timeout: 8000 }).catch(() => {});
await shot("04-stage.png");
await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));

await tap(".homeNav46 [data-open='archive']", "archive");
await page.waitForTimeout(240);
await shot("05-archive.png");
await page.evaluate(() => document.querySelectorAll(".drawer").forEach((n) => n.classList.add("hidden")));

for (const id of ["aya", "rion", "sayo"]) {
  const card = page.locator(`.charSelectPanel [data-character="${id}"], .charCard[data-character="${id}"]`).first();
  if (await card.count()) {
    await card.tap({ timeout: 6000 }).catch(() => card.click({ force: true }));
    await page.waitForTimeout(200);
  } else {
    await api("selectCharacter", id);
  }
  const after = await snap();
  assert.equal(after.player.character, id);
}
await shot("06-chars.png");

await tap("#start", "start");
if (await page.locator("#tutorialDrawer37").isVisible().catch(() => false)) {
  await shot("07-tutorial.png");
  await page.evaluate(() => document.getElementById("tutorialSkip37")?.click());
  await page.waitForFunction(
    () => {
      const drawer = document.getElementById("tutorialDrawer37");
      return !drawer || drawer.classList.contains("hidden");
    },
    null,
    { timeout: 8000 },
  );
}

let now = await snap();
if (now.mode === "dialogue") await api("dismissDialogue");
now = await snap();
if (now.mode !== "play") {
  await api("selectCharacter", "sayo");
  await api("selectStage", 1);
  const started = await api("start");
  if (started.mode === "dialogue") await api("dismissDialogue");
}
now = await snap();
assert.equal(now.mode, "play", "must enter combat");
await api("protectPlayer");
await page.waitForTimeout(200);
assert.equal(await page.locator("#joy").count(), 1);
assert.equal(await page.locator("#dash").count(), 1);
assert.equal(await page.locator("#skill").count(), 1);
assert.equal(await page.locator("#pause").count(), 1);
const hud = await boxesOf({ joy: "#joy", dash: "#dash", skill: "#skill", pause: "#pause" });
assert.ok(hud.dash && hud.dash.w >= 44 && hud.dash.h >= 44, "冲刺够点");
assert.ok(hud.skill && hud.skill.w >= 44 && hud.skill.h >= 44, "技能够点");
assert.equal(overlap(hud.dash, hud.skill), 0, "冲刺不得压技能");
await shot("08-combat.png");

const joy = page.locator("#joy");
const joyBox = await joy.boundingBox();
if (joyBox) {
  const cx = joyBox.x + joyBox.width / 2;
  const cy = joyBox.y + joyBox.height / 2;
  await page.touchscreen.tap(cx + 28, cy);
  await page.waitForTimeout(80);
}
await tap("#dash", "dash");
await tap("#skill", "skill");
await api("dashNow");

await tap("#pause", "pause");
await page.waitForSelector("#paused:not(.hidden), #resume", { timeout: 6000 });
await shot("09-pause.png");
if (await page.locator("#resume").isVisible().catch(() => false)) {
  await tap("#resume", "resume");
}

const upgraded = await api("triggerUpgrade");
assert.ok(upgraded.mode === "upgrade" || (await page.locator("#level:not(.hidden), #choices .choice").count()) > 0);
await shot("10-upgrade.png");
if (await page.locator("#choices .choice").count()) {
  await page.locator("#choices .choice").first().tap({ timeout: 8000 }).catch(() =>
    page.locator("#choices .choice").first().click({ force: true }),
  );
}
await page.waitForTimeout(200);
assert.equal((await snap()).mode, "play");

await api("protectPlayer");
await api("spawnBossNow");
if ((await snap()).mode === "dialogue") await api("dismissDialogue");
let boss = await snap();
assert.ok(boss.boss, "boss spawned");
for (const [ratio, phase, shotName] of [
  [0.75, 2, "11-boss-75.png"],
  [0.5, 3, "12-boss-50.png"],
  [0.25, 4, "13-boss-25.png"],
]) {
  await api("setBossHpRatio", ratio);
  await page.evaluate(() => window.advanceTime(17));
  const after = await snap();
  assert.equal(after.boss.phase, phase, `boss phase ${phase}`);
  await shot(shotName);
  if (after.mode === "dialogue") await api("dismissDialogue");
}

await api("defeatBoss");
await page.waitForTimeout(400);
if ((await snap()).mode === "dialogue") await api("dismissDialogue");
if (await page.locator("#result:not(.hidden)").count()) {
  await shot("14-result.png");
  if (await page.locator("#back").isVisible().catch(() => false)) await tap("#back", "result back");
} else {
  await api("finish", true);
  if (await page.locator("#back").isVisible().catch(() => false)) await tap("#back", "result back");
  else await api("backMenu");
}
await page.waitForTimeout(300);
assert.equal((await snap()).mode, "menu");
await shot("15-back-lobby.png");

await api("setRunMode46", "testimony");
const testimony = await api("start");
if (testimony.mode === "dialogue") await api("dismissDialogue");
assert.equal((await snap()).runMode, "testimony");
await shot("16-testimony.png");
await api("backMenu");

await api("selectCharacter", "aya");
await api("selectStage", 1);
const aya = await api("start");
if (aya.mode === "dialogue") await api("dismissDialogue");
assert.equal((await snap()).mode, "play");
await api("protectPlayer");
await tap("#dash", "aya dash");
await api("backMenu");

await api("selectCharacter", "rion");
const rion = await api("start");
if (rion.mode === "dialogue") await api("dismissDialogue");
assert.equal((await snap()).mode, "play");
await api("protectPlayer");
await tap("#skill", "rion skill");
await api("backMenu");

await browser.close();
const real = errors.filter((e) => !/favicon|net::ERR|Failed to load resource/i.test(e));
assert.equal(real.length, 0, real.join("\n"));
console.log("PASS mobile playthrough", out);

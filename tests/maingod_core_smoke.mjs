import assert from "node:assert/strict";
import fs from "node:fs";
import os from "os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const fallback = path.join(os.homedir(), ".codex", "skills", "develop-web-game", "scripts", "node_modules", "playwright", "index.mjs");
    if (!fs.existsSync(fallback)) throw new Error("Playwright 未安装");
    return await import(pathToFileURL(fallback).href);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = `${pathToFileURL(path.join(root, "src/index.html")).href}?test=1`;
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });

async function api(page, method, ...args) {
  return page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
}
async function state(page) {
  return JSON.parse(await page.evaluate(() => window.render_game_to_text()));
}

const context = await browser.newContext({ viewport: { width: 932, height: 430 }, isMobile: true, hasTouch: true });
await context.addInitScript(value => localStorage.setItem("sakurayoV3", value), JSON.stringify({ coins: 9, tal: { atk: 1 }, tutorialDone: true }));
const page = await context.newPage();
page.on("pageerror", error => { throw error; });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.locator(".bootArt35").waitFor({ state: "detached", timeout: 8000 });

const migrated = await api(page, "saveSnapshot");
assert.equal(migrated.coins, 9);
assert.equal(migrated.mainGod.core.shards, 0);
assert.equal(migrated.mainGod.core.crimson, 0);
assert.equal(migrated.mainGod.geneLock, 0);

await api(page, "unlockMainGod");
const shop = await api(page, "openMainGodShop36");
assert.equal(shop.hall, true, "兑换大厅应有精装修外壳");
assert.equal(shop.hero, true, "兑换大厅应有账户条");
assert.equal(shop.cards, 28, "旧货架 + 8 件外设应为 28 张 exchangeCard36");
assert.equal(shop.core, 8);
assert.ok(shop.tabs.includes("模板") && shop.tabs.includes("特效"));
assert.equal(await api(page, "pickMainGodBossType46", 0, 1, 1), "mirror");
await api(page, "grantMainGodPoints", 80);
const bought = await api(page, "buyMainGodTemplate46", "crimson");
assert.equal(bought.bought, true);
assert.equal(bought.snapshot.mainGod.core.eqMain, "crimson");
await api(page, "buyMainGodTemplate46", "qi");
await api(page, "equipMainGodTemplate46", "qi", "sub");
await api(page, "grantMainGodShards46", 8);
const lock = await api(page, "buyMainGodLock46", "lockSpecial");
assert.equal(lock.bought, true);
assert.equal(lock.snapshot.mainGod.core.lockSpecial, 1);
await api(page, "grantMainGodPoints", 20);
const boots = await api(page, "buyMainGodItem", "echoBoots");
assert.equal(boots.bought, true);
assert.equal(boots.snapshot.mainGod.echoBoots, 1);

await api(page, "selectCharacter", "sayo");
await api(page, "selectMainGodTier", 1);
await api(page, "start");
await api(page, "dismissDialogue");
let snap = await state(page);
assert.equal(snap.runMode, "mainGod");
assert.ok(snap.player.steal > 0, "猩红主模板应开局吸血");
assert.ok(snap.player.orbit >= 1, "气机副模板应开局飞剑");
assert.ok(snap.player.mgCrimson > 0);
assert.ok(snap.player.mgBurst > 0, "猩红＋气机＋潜能特化应解锁心核激荡");
assert.ok(snap.player.mgEcho > 0, "折跃残影靴应只在主神开局生效");

await api(page, "backMenu");
await api(page, "selectStage", 1);
await api(page, "start");
await api(page, "dismissDialogue");
snap = await state(page);
assert.equal(snap.runMode, "story");
assert.equal(snap.player.steal, 0, "模板不得带进普通四章");
assert.equal(snap.player.mgBurst, 0);
assert.equal(snap.player.orbit, 0);
assert.equal(snap.player.mgEcho, 0, "外设不得带进普通四章");

for (const id of ["sayo", "aya", "rion"]) {
  await api(page, "backMenu");
  await api(page, "selectCharacter", id);
  await api(page, "selectMainGodTier", 1);
  await api(page, "start");
  await api(page, "dismissDialogue");
  await api(page, "protectPlayer");
  await page.evaluate(() => window.advanceTime(400));
  snap = await state(page);
  if (snap.mode === "event") await api(page, "chooseEvent", 0);
  await page.evaluate(() => window.advanceTime(1200));
  snap = await state(page);
  assert.equal(snap.mode, "play", `${id} 主神开局应进入战斗`);
  assert.ok(snap.player.steal > 0, `${id} 应带上猩红吸血`);
}

await api(page, "spawnBossNow");
const bossFx = await api(page, "mainGodBoss46");
assert.equal(bossFx.type, "mirror", "clears0+T1+depth1 应为镜像投影");
assert.ok(bossFx.fx.some(x => x.kind === "mirror"), "镜像投影应有可打碎的镜核");
assert.match(bossFx.rule || "", /镜核|适应/);
const beforeFinish = await api(page, "saveSnapshot");
await api(page, "finish", true);
const after = await api(page, "saveSnapshot");
assert.ok(after.mainGod.core.shards >= 1, "T1 通关应给基因锁碎片");
assert.equal(after.mainGod.core.crimson, 1);
assert.deepEqual(after.story, beforeFinish.story, "主神通关不得改写四章剧情");
assert.deepEqual(after.endings, beforeFinish.endings, "主神通关不得写入普通结局");

await browser.close();
console.log("maingod_core_smoke: ok");

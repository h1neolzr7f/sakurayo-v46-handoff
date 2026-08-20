import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
    if (!fs.existsSync(fallback)) {
      throw new Error("Playwright 未安装：请执行 npm i -D playwright && npx playwright install chromium");
    }
    return await import(pathToFileURL(fallback).href);
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const sourceArg = process.argv[2] || "src/index.html";
const source = /^https?:\/\//i.test(sourceArg) ? sourceArg : path.resolve(projectRoot, sourceArg);
const sourceFile = /^https?:\/\//i.test(source) ? path.resolve(projectRoot, "src/index.html") : source;
const artifactDir = path.resolve(projectRoot, "tests/artifacts/smoke");
fs.mkdirSync(artifactDir, { recursive: true });
const normalUrl = /^https?:\/\//i.test(source) ? source : pathToFileURL(source).href;
const url = `${normalUrl}?test=1&debug=1`;
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const passed = [];
const screenshots = [];

function pass(name) {
  passed.push(name);
  console.log(`PASS ${name}`);
}

async function state(page) {
  return JSON.parse(await page.evaluate(() => window.render_game_to_text()));
}

async function api(page, method, ...args) {
  return page.evaluate(
    ({ method, args }) => window.__SAKURAYO_TEST__[method](...args),
    { method, args },
  );
}

async function shot(page, name, fullPage = true) {
  const output = path.join(artifactDir, name);
  await page.screenshot({ path: output, fullPage });
  screenshots.push(output);
}

function outfitIdleExists(character, folder) {
  return fs.existsSync(path.join(projectRoot, "android-app/app/src/main/assets/game/art/characters", character, folder, "anim_idle.webp"));
}

async function waitOutfitLive(page, layerId) {
  await page.waitForFunction(id => window.__SAKURAYO_TEST__.outfitStatus45().live === id, layerId, { timeout: 10000 });
}

function dropMissingOutfitConsoleErrors(tracker) {
  tracker.consoleErrors = tracker.consoleErrors.filter(text => !/(?:career_|form_|fusion_)[A-Za-z]+\/anim_|fusions\/[A-Za-z]+\/splash/.test(text));
}

async function openPage(context, tracker, targetUrl = url) {
  const page = await context.newPage();
  page.on("pageerror", error => tracker.pageErrors.push(String(error)));
  page.on("console", message => {
    if (message.type() !== "error") return;
    const text = `${message.text()} ${message.location()?.url || ""}`;
    if (/(?:career_|form_|fusion_)[A-Za-z]+\/anim_|fusions\/[A-Za-z]+\/splash/.test(text)) return;
    tracker.consoleErrors.push(message.text());
  });
  page.on("request", request => {
    if (/^https?:/i.test(request.url()) && new URL(request.url()).origin !== new URL(targetUrl).origin) tracker.externalRequests.push(request.url());
  });
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  return page;
}

let mainContext;
let legacyContext;
let normalContext;
try {
  normalContext = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  const normalTracker = { pageErrors: [], consoleErrors: [], externalRequests: [] };
  const normalPage = await openPage(normalContext, normalTracker, normalUrl);
  await normalPage.locator(".bootArt35").waitFor({ state: "detached", timeout: 5000 });
  assert.equal(await normalPage.locator("#menu").isVisible(), true);
  assert.equal(await normalPage.evaluate(() => typeof window.__SAKURAYO_TEST__), "undefined");
  assert.equal(await normalPage.evaluate(() => typeof window.__SAKURAYO_BETA__), "undefined");
  assert.equal(await normalPage.locator("#betaButton40").count(), 0);
  assert.equal(await normalPage.locator("#mailButton46").count(), 1);
  assert.equal(await normalPage.locator("#mailDrawer").count(), 1);
  for (let i = 0; i < 7; i++) await normalPage.locator("#coverTitle36").click({ force: true });
  assert.equal(await normalPage.locator("#betaDrawer40").count(), 0);
  await normalPage.locator("#mailButton46").click();
  assert.equal(await normalPage.locator("#mailDrawer").isVisible(), true);
  assert.match(await normalPage.locator("#mailDrawer").textContent(), /内测致谢/);
  await normalPage.locator("#mailDrawer .close").click();
  assert.equal(await normalPage.evaluate(() => typeof window.render_game_to_text), "undefined");
  assert.equal(await normalPage.evaluate(() => window.__SAKURAYO_DEV__.enabled), false);
  assert.equal(normalTracker.pageErrors.length, 0);
  assert.equal(normalTracker.consoleErrors.length, 0, normalTracker.consoleErrors.join("\n"));
  assert.equal(normalTracker.externalRequests.length, 0);
  pass("普通发布模式不暴露测试 API、内测后门与快照钩子");
  await normalContext.close();
  normalContext = null;

  for (const [width, height] of [[360, 800], [932, 430]]) {
    const layoutContext = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
    const layoutTracker = { pageErrors: [], consoleErrors: [], externalRequests: [] };
    const layoutPage = await openPage(layoutContext, layoutTracker, normalUrl);
    assert.equal(await layoutPage.locator("#menu").isVisible(), true);
    assert.equal(await layoutPage.locator("#start").isVisible(), true);
    const metrics = await layoutPage.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    assert.ok(metrics.scrollWidth <= metrics.innerWidth + 1, `${width}x${height} 存在横向溢出`);
    assert.equal(layoutTracker.pageErrors.length, 0);
    assert.equal(layoutTracker.consoleErrors.length, 0);
    await shot(layoutPage, `00-layout-${width}x${height}.png`);
    await layoutContext.close();
    pass(`${width}×${height} 主菜单布局`);
  }

  legacyContext = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await legacyContext.addInitScript(value => {
    localStorage.setItem("sakurayoV3", value);
  }, JSON.stringify({ coins: 7, tal: { atk: 1 }, settings: { glow: "soft" } }));
  const legacyTracker = { pageErrors: [], consoleErrors: [], externalRequests: [] };
  const legacyPage = await openPage(legacyContext, legacyTracker);
  const migrated = await api(legacyPage, "saveSnapshot");
  assert.equal(migrated.coins, 7);
  assert.equal(migrated.tal.atk, 1);
  assert.equal(migrated.tal.hp, 0);
  assert.equal(migrated.character, "sayo");
  assert.equal(migrated.skin, "default");
  assert.ok(migrated.ownedSkins.includes("default"));
  assert.equal(migrated.settings.glow, "off");
  assert.equal(migrated.settings.glowVersion, 2);
  assert.deepEqual(migrated.mainGod, { points: 0, unlockedTier: 1, bestTier: 0, clears: 0, runs: 0, deepest: 0, contracts: {}, challenges: {}, power: 0, vitality: 0, tempo: 0, resonance: 0, fortune: 0, regenBlood: 0, psiLink: 0, gunBlade: 0, mageCircuit: 0, summonPage: 0, spaceRing: 0, rebirthDoll: 0, sideKey: 0, cursedHeart: 0 });
  assert.ok(migrated.shop40 && migrated.shop40.ops, "旧存档应补齐 shop40.ops");
  const legacyLobby = await api(legacyPage, "lobby46");
  assert.ok(legacyLobby.shown.includes("sayo_echo"), "旧存档补齐后应拥有 sayo_echo");
  assert.ok(legacyLobby.shown.includes("aya_petal"), "旧存档补齐后应拥有 aya_petal");
  assert.equal(legacyTracker.pageErrors.length, 0);
  assert.equal(legacyTracker.consoleErrors.length, 0);
  assert.equal(legacyTracker.externalRequests.length, 0);
  pass("缺字段旧存档迁移并保留已有数据");
  await legacyContext.close();
  legacyContext = null;

  mainContext = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await mainContext.addInitScript(() => {
    let seed = 0x5a17c9;
    Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  });
  const tracker = { pageErrors: [], consoleErrors: [], externalRequests: [] };
  const page = await openPage(mainContext, tracker);
  await page.locator(".bootArt35").waitFor({ state: "detached", timeout: 5000 });
  assert.equal(await page.locator("#menu").isVisible(), true);
  assert.equal(await page.locator("#characterList .charCard").count(), 3);
  assert.equal(await page.locator("#start").isVisible(), true);
  assert.equal(await page.locator("#coverTitle36").isVisible(), true);
  assert.match(await page.locator("#menu .bg").evaluate(node => node.style.backgroundImage), /lobby_wide\.webp/);
  await page.waitForFunction(() => {
    const boot = new Set(window.__SAKURAYO_ART__?.boot() || []);
    return window.__SAKURAYO_ART__?.status().filter(item => boot.has(item.path)).every(item => item.ready);
  }, null, { timeout: 10000 });
  const artStatus = await page.evaluate(() => window.__SAKURAYO_ART__.status());
  assert.equal(artStatus.length, 20);
  assert.equal(artStatus.filter(item => item.ready).length, 12);
  assert.equal(artStatus.filter(item => !item.loaded).length, 8);
  assert.equal(await page.locator("#menu .nav img").count(), 5);
  assert.ok(await page.locator("#characterList .charCard img").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
  await page.waitForFunction(() => {
    const image = document.querySelector("#menu .menuBrand35");
    return image?.complete && image.naturalWidth > 0;
  });
  if (!(await page.locator("#statsButton37").isVisible())) {
    await page.locator("#moreButton39").click();
  }
  await page.locator("#modKitButton42").click();
  assert.equal(await page.locator("#modKitDrawer42 .modKitPack42").count(), 5);
  assert.equal(await page.locator("#modKitDrawer42 .modKitPack42.enabled").count(), 5);
  assert.match(await page.locator("#modKitDrawer42 .modKitSummary42").textContent(), /5\/5 已启用/);
  await shot(page, "01a-modkit-packs.png");
  await page.locator("#modKitDrawer42 .close").click();
  pass("Mod Kit 面板显示内容格式、依赖与扩展启用状态");
  // 飞升/成就已收入 #archiveDrawer，须先开档案再点子项。shop/stage 仍在主 nav。
  await page.locator('[data-open="archive"]').click();
  await page.locator('[data-open="asc"]').click();
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll("#ascList .storyIcon img")];
    return images.length >= 30 && images.every(image => image.complete && image.naturalWidth > 0);
  });
  assert.ok(await page.locator("#ascList .storyIcon img").count() >= 30);
  assert.equal(await page.locator("#careerSearch37").count(), 1);
  await page.locator("#careerSearch37").fill("机械师");
  assert.ok(await page.locator("#ascList .storyCard:visible").count() >= 1);
  await page.locator("#careerSearch37").fill("");
  await shot(page, "01b-ascension-art.png");
  await page.locator("#ascDrawer .close").click();
  await page.locator('[data-open="archive"]').click();
  await page.locator('[data-open="ach"]').click();
  await page.waitForFunction(() => {
    const image = document.querySelector("#achList .achievementMaster35 img");
    return image?.complete && image.naturalWidth > 0;
  });
  assert.equal(await page.locator("#achList .achievementMaster35").count(), 1);
  await page.locator("#achDrawer .close").click();
  await page.locator('[data-open="shop"]').click();
  assert.equal(await page.locator("#shopList .skinCard").count(), 11);
  assert.equal(await page.locator("#shopList .shopTabs40 button").count(), 5);
  assert.equal(await page.locator('#shopList [data-shop="starters"]').count(), 1);
  assert.equal(await page.locator("#shopList .shopItem40").count(), 24);
  assert.equal(await page.locator("#shopWallet44").count(), 1);
  assert.match(await page.locator("#shopWallet44").textContent(), /初始|核心|🌸/);
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll("#shopList .skinPreview img")];
    return images.length === 11 && images.every(image => image.complete && image.naturalWidth > 0);
  }, null, { timeout: 15000 });
  await shot(page, "01e-costume-shop.png");
  await page.locator('#shopList [data-shop="starters"]').click();
  await shot(page, "01f-starter-shop.png");
  await page.locator("#shopDrawer .close").click();

  const lobby = await api(page, "lobby46");
  assert.equal(lobby.version, "4.6.6");
  assert.ok(lobby.shown.includes("sayo_echo"));
  assert.ok(lobby.shown.includes("aya_petal"));
  assert.equal(lobby.cards.length, 8);
  assert.deepEqual(lobby.pages, ["remnant", "fashion", "weapon"]);
  assert.deepEqual(lobby.rosterTabs, ["scrap", "school", "job", "fusion", "fashion", "weapon"]);
  assert.equal(lobby.rates.single, 160);
  assert.equal(lobby.rates.ten, 1440);
  assert.equal(lobby.rates.softPity, 65);
  assert.equal(lobby.rates.spark, 200);
  const dockHit = await page.evaluate(() => {
    const btn = document.querySelector("#menu .homeNav46 [data-open=\"gacha\"]") || document.querySelector("#menu .nav [data-open=\"gacha\"]");
    if (!btn) return false;
    const box = btn.getBoundingClientRect();
    const el = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return !!(el && (el === btn || btn.contains(el)));
  });
  assert.equal(dockHit, true, "竖屏底栏寻访键被角色卡挡住");
  const gachaOpen = await api(page, "openDrawer", "gacha");
  assert.equal(gachaOpen.visible, true);
  assert.equal(await page.locator("#gachaDrawer").isVisible(), true);
  assert.match(await page.locator("#gachaDrawer").textContent(), /镜界寻访/);
  assert.equal(await page.locator("#gachaTabs46 [data-pool]").count(), 3);
  await page.locator('#gachaTabs46 [data-pool="fashion"]').click();
  assert.match(await page.locator("#gachaDrawer").textContent(), /时装/);
  const emptyFashion = await api(page, "pullGacha46", 1);
  assert.equal(emptyFashion.ok, false);
  assert.equal(emptyFashion.reason, "coins");
  await page.locator('#gachaTabs46 [data-pool="weapon"]').click();
  assert.match(await page.locator("#gachaDrawer").textContent(), /武器/);
  const emptyWeapon = await api(page, "pullGacha46", 1);
  assert.equal(emptyWeapon.ok, false);
  assert.equal(emptyWeapon.reason, "coins");
  await page.locator('#gachaTabs46 [data-pool="remnant"]').click();
  assert.match(await page.locator("#gachaDrawer").textContent(), /残片进仓库/);
  const coinsBeforeFail = (await api(page, "lobby46")).coins;
  const broke = await api(page, "pullGacha46", 1);
  assert.equal(broke.ok, false);
  assert.equal(broke.reason, "coins");
  assert.equal(broke.coins, coinsBeforeFail);
  const cheat = await api(page, "grantCheat46");
  assert.equal(cheat.blocked, true);
  assert.ok(cheat.coins < 9999);
  const mailOpen = await api(page, "openMail46");
  assert.equal(mailOpen.visible, true);
  assert.equal(await page.locator("#mailDrawer").isVisible(), true);
  assert.match(await page.locator("#mailDrawer").textContent(), /内测致谢/);
  const claimed = await api(page, "claimMail46", "beta-thanks-463");
  assert.equal(claimed.ok, true);
  assert.ok(claimed.coins >= 9999);
  const shardsBefore = (await api(page, "lobby46")).shards;
  const single = await api(page, "pullGacha46", 1);
  assert.equal(single.ok, true);
  assert.equal(single.results.length, 1);
  assert.ok(single.pulls >= 1);
  assert.ok((await api(page, "lobby46")).shards >= shardsBefore + 1);
  const ten = await api(page, "pullGacha46", 10);
  assert.equal(ten.ok, true);
  assert.equal(ten.results.length, 10);
  assert.ok(ten.tenPulls >= 1);
  await shot(page, "01h-gacha-drawer.png");
  await page.locator("#gachaDrawer .close").click();
  const rosterOpen = await api(page, "openDrawer", "roster");
  assert.equal(rosterOpen.visible, true);
  assert.match(await page.locator("#rosterDrawer").textContent(), /镜界仓库/);
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 8);
  await page.locator('#rosterTabs46 [data-roster="school"]').click();
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 14);
  assert.match(await page.locator("#rosterDrawer").textContent(), /待寻访/);
  await page.locator('#rosterTabs46 [data-roster="job"]').click();
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 28);
  assert.match(await page.locator("#rosterDrawer").textContent(), /待寻访/);
  assert.equal(await page.locator("#rosterDrawer").textContent().then((t) => t.includes("星核机甲少女")), false);
  await page.locator('#rosterTabs46 [data-roster="fusion"]').click();
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 24);
  assert.match(await page.locator("#rosterDrawer").textContent(), /待寻访/);
  assert.equal(await page.locator("#rosterDrawer").textContent().then((t) => t.includes("后续写入")), false);
  assert.equal(await page.locator("#rosterDrawer").textContent().then((t) => /星核机甲|血炼剑仙|瘟炼菌海/.test(t)), false);
  await page.locator('#rosterTabs46 [data-roster="fashion"]').click();
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 12);
  await page.locator('#rosterTabs46 [data-roster="weapon"]').click();
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 12);
  await page.locator('#rosterTabs46 [data-roster="chronicle"]').click();
  assert.match(await page.locator("#rosterDrawer").textContent(), /第零次死亡/);
  assert.match(await page.locator("#rosterDrawer").textContent(), /镜零之后/);
  assert.match(await page.locator("#rosterDrawer").textContent(), /月城小夜 · 未写完的夜/);
  assert.match(await page.locator("#rosterDrawer").textContent(), /神代绫 · 作废的工号/);
  assert.match(await page.locator("#rosterDrawer").textContent(), /黑羽凛音 · 未署名的刀/);
  assert.match(await page.locator("#rosterDrawer").textContent(), /工牌还在/);
  assert.match(await page.locator("#rosterDrawer").textContent(), /无人掀盖/);
  assert.equal(await page.locator(".chronicleCard46").count(), 13);
  assert.equal(await page.locator("#rosterWall46 h4").count(), 3);
  await page.locator('#rosterTabs46 [data-roster="scrap"]').click();
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 8);
  await shot(page, "01i-roster-wall.png");
  await page.locator("#rosterDrawer .close").click();
  await page.locator('[data-open="stage"]').click();
  assert.equal(await page.locator("#modeBar46").count(), 1);
  assert.match(await page.locator("#modeBar46").textContent(), /回收演习/);
  assert.match(await page.locator("#modeBar46").textContent(), /证词模式/);
  assert.match(await page.locator("#modeBar46").textContent(), /主神空间/);
  await shot(page, "01j-stage-modes.png");
  await page.locator("#stageDrawer .close").click();
  await page.locator('[data-open="archive"]').click();
  assert.match(await page.locator("#archiveDrawer").textContent(), /剧情档案/);
  assert.match(await page.locator("#archiveDrawer").textContent(), /永久天赋/);
  await shot(page, "01k-archive.png");
  await page.locator("#archiveDrawer .close").click();
  pass("V4.6.6 镜界寻访三页、仓库与邮箱领取");

  const betaPanel = await api(page, "openBeta40");
  assert.equal(betaPanel.visible, false);
  assert.equal(betaPanel.blocked, true);
  assert.equal(await page.locator("#betaDrawer40").count(), 0);
  assert.equal(await page.locator("#betaButton40").count(), 0);
  assert.equal(await page.evaluate(() => typeof window.__SAKURAYO_BETA__), "undefined");
  await page.locator("#mailDrawer .close").click();
  await api(page, "grantCoins40", 500);
  const starterPurchase = await api(page, "buyInitialCore40", "assault");
  assert.equal(starterPurchase.bought, true);
  assert.equal(starterPurchase.snapshot.shop40.starter.assault, 1);
  assert.equal(starterPurchase.snapshot.shop40.equippedStarter, "assault");
  const baitPurchase = await api(page, "buyShopItem40", "bait");
  assert.equal(baitPurchase.bought, true);
  assert.equal(baitPurchase.snapshot.shop40.items.bait, 1);
  assert.equal(baitPurchase.snapshot.shop40.baitEquipped, true);
  pass("正式模式隐藏内测后门，测试模式可直达场景并导出本地报告");
  const costumeSkins = ["techcoat", "biodress", "psirobe", "haori", "idol", "apron", "summon", "festival", "framework_observer", "phantom"];
  for (const character of ["sayo", "aya", "rion"]) {
    await api(page, "selectCharacter", character);
    for (const skin of costumeSkins) {
      const selected = await api(page, "selectSkin", skin);
      assert.equal(selected.player.character, character);
      assert.equal(selected.player.skin, skin);
      await page.waitForFunction(() => {
        const images = [...document.querySelectorAll("#characterList .charCard img")];
        return images.length === 3 && images.every(image => image.complete && image.naturalWidth > 0);
      });
    }
  }
  await api(page, "selectCharacter", "sayo");
  await api(page, "selectSkin", "default");
  pass("30 costume sets decode and switch in the offline shop, including the official extension");
  const canvasBox = await page.locator("#game").boundingBox();
  assert.ok(canvasBox && canvasBox.width > 0 && canvasBox.height > 0);
  const coldCombatArt = await api(page, "combatArtStatus");
  assert.equal(coldCombatArt.filter(item => item.loaded).length, 0);
  await api(page, "preloadCombatArt412");
  await page.waitForFunction(() => window.__SAKURAYO_COMBAT_ART__?.status().every(item => item.ready), null, { timeout: 20000 });
  const combatArt = await api(page, "combatArtStatus");
  assert.equal(combatArt.length, 38);
  assert.equal(combatArt.every(item => item.width === 512 && item.height === 512), true);
  await shot(page, "01-menu-430x932.png");
  pass("首屏仅解码 9 项必要美术，6 项角色动作与 38 项战斗美术按需加载且均可本地解码");
  pass("430×932 新存档主菜单与三角色卡");

  assert.equal(await page.locator("#guideButton37").count(), 1);
  assert.equal(await page.locator("#statsButton37").count(), 1);
  assert.equal(await page.locator("#saveButton38").count(), 1);
  const saveManager = await api(page, "openSaveManager");
  assert.equal(saveManager.visible, true);
  assert.match(saveManager.text, /"mainGod"/);
  await page.locator("#saveDrawer38 .close").click();
  await page.locator("#start").click();
  assert.equal(await page.locator("#tutorialDrawer37").isVisible(), true);
  assert.match(await page.locator("#tutorialArt37").textContent(), /自动瞄准/);
  await shot(page, "01c-tutorial.png");
  for (let i = 0; i < 4; i++) await page.locator("#tutorialNext37").click();
  assert.equal((await state(page)).mode, "dialogue");
  assert.equal(await page.locator("#dialogueChapter").count(), 1);
  await api(page, "dismissDialogue");
  await api(page, "backMenu");
  if (!(await page.locator("#statsButton37").isVisible())) {
    await page.locator("#moreButton39").click();
  }
  assert.equal(await page.locator("#statsButton37").isVisible(), true);
  await page.locator("#statsButton37").click();
  assert.equal(await page.locator("#analyticsDrawer37").isVisible(), true);
  assert.match(await page.locator("#analyticsText37").inputValue(), /"version": "4.6.6"/);
  await page.locator("#analyticsDrawer37 .close").click();
  await page.locator("#settingsButton37").click();
  assert.equal(await page.locator("#settingsDrawer37").isVisible(), true);
  assert.equal(await page.locator("#settingsBody37 input[type=range]").count(), 3);
  assert.equal(await page.locator("#settingsBody37 [data-toggle]").count(), 2);
  assert.equal(await page.locator("#hudSize38").count(), 1);
  assert.equal(await page.locator("#damageText39").count(), 1);
  assert.equal(await page.locator("#contrast39").count(), 1);
  assert.equal(await page.locator("#calmUi39").count(), 1);
  assert.equal(await page.locator("#battleGlow421").count(), 1);
  assert.match(await page.locator("#battleGlow421").textContent(), /关闭/);
  await page.locator("#battleGlow421").click();
  assert.match(await page.locator("#battleGlow421").textContent(), /柔和/);
  await page.locator("#battleGlow421").click();
  await page.locator("#battleGlow421").click();
  assert.match(await page.locator("#battleGlow421").textContent(), /关闭/);
  pass("V4.4.3 普通战斗无发光、静态清晰立绘与界面减法设置");
  await page.locator("#hudSize38").click();
  assert.equal(await page.locator("body").evaluate(node => node.classList.contains("compactHud38")), true);
  await page.locator("#hudSize38").click();
  assert.equal(await page.locator("body").evaluate(node => node.classList.contains("compactHud38")), false);
  await page.locator('#settingsBody37 input[data-setting="master"]').fill("0.6");
  await shot(page, "01d-settings.png");
  await page.locator("#settingsDrawer37 .close").click();
  pass("首次开局教程、职业搜索与本地统计导出入口");

  const baseCombat = {};
  const geometry = await api(page, "playerGeometry");
  assert.equal(geometry.visualSize, 96);
  assert.equal(geometry.footOffset, 18);
  assert.equal(geometry.radius, 16);
  assert.ok(geometry.radius * 2 / geometry.visualSize <= 0.36);
  assert.equal(await api(page, "circleCollision", 20, 16, 5), true);
  assert.equal(await api(page, "circleCollision", 22, 16, 5), false);
  assert.equal(await api(page, "meleeCollision", 145, 128, 18), true);
  assert.equal(await api(page, "meleeCollision", 147, 128, 18), false);
  pass("Q版视觉尺寸、脚底锚点与圆形碰撞阈值");
  for (const [id, distance] of [["sayo", 105], ["aya", 85], ["rion", 68]]) {
    await api(page, "backMenu");
    await api(page, "selectCharacter", id);
    await api(page, "start");
    await api(page, "dismissDialogue");
    await api(page, "protectPlayer");
    await api(page, "freezeProgression");
    await api(page, "spawnEnemyNear", "normal", distance);
    await page.evaluate(() => window.advanceTime(7000));
    const snapshot = await state(page);
    baseCombat[id] = snapshot.player;
    assert.equal(snapshot.mode, "play");
    assert.equal(snapshot.player.character, id);
    assert.equal(snapshot.player.portraitMode, "static");
    assert.ok(snapshot.counts.enemies > 0);
    assert.ok(snapshot.build.attackTotal > 0, `${id} 未产生攻击伤害`);
    await shot(page, `02-character-${id}.png`);
    pass(`${id} 开局、敌人、自动攻击`);

    if (id === "sayo") {
      const cam = snapshot.camera;
      assert.ok(cam, "缺少镜头快照");
      assert.equal(cam.cols, 4);
      assert.equal(cam.rows, 2);
      assert.equal(cam.screens, 8);
      assert.ok(Math.abs(snapshot.player.x - cam.worldW / 2) < 160, "开局角色应在 4×2 世界中心附近");
      assert.ok(Math.abs(cam.camX + cam.viewW / 2 - snapshot.player.x) < 60, "镜头应居中跟随角色");
      const edge = await api(page, "spawnFromEdge50");
      assert.equal(edge.inside, false, "普通刷怪应出现在当前视口外");
      pass("镜头 4×2 世界且角色居中");
      const beforeMove = snapshot.player.x;
      await page.evaluate(() => {
        const canvas = document.querySelector("#game");
        canvas.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 71, pointerType: "touch", clientX: 100, clientY: 700 }));
        canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 71, pointerType: "touch", clientX: 150, clientY: 700 }));
      });
      await page.evaluate(() => window.advanceTime(700));
      await page.evaluate(() => {
        document.querySelector("#game").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 71, pointerType: "touch", clientX: 150, clientY: 700 }));
      });
      const afterMove = await state(page);
      assert.ok(afterMove.player.x > beforeMove + 1, "触控摇杆未推动角色");
      await page.locator("#dash").click();
      const dashState = await state(page);
      assert.ok(dashState.player.dashCooldown > 0);
      assert.equal(dashState.player.animation, "dash");
      await page.locator("#skill").click();
      assert.ok((await state(page)).player.skillCooldown > 0);
      pass("触控摇杆、冲刺、主动技能");

      const freshOutfit = await api(page, "outfitStatus45");
      const freshSnap = await state(page);
      assert.equal(freshOutfit.live, null);
      assert.equal(freshOutfit.form, null);
      assert.equal(freshOutfit.career, null);
      assert.equal(freshSnap.player.outfit, null);
      assert.equal(freshSnap.player.careerBranch, null);
      assert.equal(freshSnap.build.form, null);

      const exorcistSnap = await api(page, "forceOutfit45", "career", "exorcist");
      assert.equal(exorcistSnap.player.careerBranch, "exorcist");
      assert.ok(exorcistSnap.player.outfitFade > 0);
      assert.equal(exorcistSnap.build.form, null);
      const exorcistStatus = await api(page, "outfitStatus45");
      assert.equal(exorcistStatus.career, "exorcist");
      assert.ok(exorcistStatus.layers.includes("career_exorcist"));
      if (outfitIdleExists("sayo", "career_exorcist")) {
        await waitOutfitLive(page, "career_exorcist");
        const readyExorcist = await api(page, "outfitStatus45");
        assert.equal(readyExorcist.live, "career_exorcist");
        assert.equal(readyExorcist.ready.find(item => item.id === "career_exorcist")?.idle, true);
        assert.equal((await state(page)).player.outfit, "career_exorcist");
      }

      const formSnap = await api(page, "forceOutfit45", "form", "tech");
      assert.equal(formSnap.build.form, "tech");
      assert.equal(formSnap.player.careerBranch, "exorcist");
      assert.ok(formSnap.player.outfitFade > 0);
      if (outfitIdleExists("sayo", "form_tech")) {
        await waitOutfitLive(page, "form_tech");
      }
      const formStatus = await api(page, "outfitStatus45");
      assert.equal(formStatus.form, "tech");
      assert.ok(formStatus.layers.includes("form_tech"));
      assert.ok(formStatus.layers.includes("career_exorcist"));
      assert.ok(formStatus.layers.indexOf("form_tech") < formStatus.layers.indexOf("career_exorcist"), "飞升层应压过职业层");
      if (outfitIdleExists("sayo", "form_tech")) {
        assert.equal(formStatus.live, "form_tech");
        assert.equal((await state(page)).player.outfit, "form_tech");
      }
      const fusionSnap = await api(page, "forceOutfit45", "fusion", "magitech");
      assert.equal(fusionSnap.build.fusion, "magitech");
      assert.ok(fusionSnap.player.outfitFade > 0);
      assert.ok(fusionSnap.player.outfitReveal > 0);
      const fusionStatus = await api(page, "outfitStatus45");
      assert.equal(fusionStatus.fusion, "magitech");
      assert.ok(fusionStatus.layers.includes("fusion_magitech"));
      assert.ok(fusionStatus.layers.includes("form_tech"));
      assert.ok(fusionStatus.layers.indexOf("form_tech") < fusionStatus.layers.indexOf("fusion_magitech"), "飞升层应压过融合层");
      assert.ok(fusionStatus.layers.indexOf("fusion_magitech") < fusionStatus.layers.indexOf("career_exorcist"), "融合层应压过职业层");
      if (outfitIdleExists("sayo", "form_tech")) assert.equal(fusionStatus.live, "form_tech");
      else if (outfitIdleExists("sayo", "fusion_magitech")) {
        await waitOutfitLive(page, "fusion_magitech");
        assert.equal((await api(page, "outfitStatus45")).live, "fusion_magitech");
      }
      await page.evaluate(() => window.advanceTime(17));
      await shot(page, "45-sayo-form-tech.png");

      const barrageSnap = await api(page, "forceOutfit45", "career", "barrage", 2);
      assert.equal(barrageSnap.build.form, "tech");
      const barrageStatus = await api(page, "outfitStatus45");
      assert.ok(barrageStatus.layers.includes("form_tech"));
      assert.ok(barrageStatus.layers.includes("career_exorcist") || barrageStatus.layers.includes("career_barrage"));
      if (outfitIdleExists("sayo", "form_tech")) assert.equal(barrageStatus.live, "form_tech");
      pass("小夜职业与飞升换装层");
    } else if (id === "aya" || id === "rion") {
      const branch = id === "aya" ? "shadow" : "swordSaint";
      const folder = `career_${branch}`;
      const forced = await api(page, "forceOutfit45", "career", branch);
      assert.equal(forced.player.careerBranch, branch);
      assert.ok(forced.player.outfitFade > 0);
      const status = await api(page, "outfitStatus45");
      assert.equal(status.career, branch);
      assert.ok(status.layers.includes(folder));
      if (outfitIdleExists(id, folder)) {
        await waitOutfitLive(page, folder);
        const ready = await api(page, "outfitStatus45");
        assert.equal(ready.live, folder);
        assert.equal(ready.ready.find(item => item.id === folder)?.idle, true);
        assert.equal((await state(page)).player.outfit, folder);
      }
      pass(`${id} ${branch} 换装层`);
    }
  }
  await api(page, "clearCombat");
  await api(page, "spawnEnemyNear", "normal", 48);
  const dodge = await api(page, "dashNow");
  assert.equal(dodge.player.perfectDodges, 1);
  assert.ok(dodge.player.dashCooldown > 0);
  await api(page, "clearCombat");
  const roleProbe = await api(page, "enemyRoleProbe", "fast", 190, .1);
  assert.ok(roleProbe.roleCooldown > 2, "迅捷尸应进入冲锋职责冷却");
  pass("完美闪避角色反击与迅捷尸冲锋职责");
  assert.ok(baseCombat.aya.attackDamage < baseCombat.sayo.attackDamage, "手枪单发伤害必须低于步枪");
  assert.ok(baseCombat.aya.attackInterval > baseCombat.sayo.attackInterval, "手枪射击间隔必须长于步枪");
  assert.ok(baseCombat.rion.attackRange < baseCombat.aya.attackRange, "纯太刀角色必须保持近战射程");
  pass("步枪、手枪与太刀基础数值定位");

  await api(page, "backMenu");
  await api(page, "selectCharacter", "sayo");
  await api(page, "configureStarter40", "assault", 1, false);
  await api(page, "selectStage", 1);
  await api(page, "start");
  await api(page, "dismissDialogue");
  const starterL1S1 = await state(page);
  await api(page, "backMenu");
  await api(page, "configureStarter40", "assault", 5, false);
  await api(page, "selectStage", 4);
  await api(page, "start");
  await api(page, "dismissDialogue");
  const starterL5S4 = await state(page);
  assert.equal(starterL5S4.player.initialCore, "assault");
  assert.equal(starterL5S4.player.initialCoreLevel, 5);
  assert.ok(starterL5S4.player.attackDamage > starterL1S1.player.attackDamage * 1.45, "初始核心等级和后期章节同步倍率未生效");
  pass("初始强化等级成长并随后期章节提高同步倍率");

  await api(page, "unlockMainGod");
  await api(page, "setBannedSchools40", ["gun", "mech"]);
  const bannedPools = await api(page, "sampleUpgradePools40", 40);
  assert.equal(bannedPools.flat().some(item => ["gun", "mech"].includes(item.school) && !item.career), false, "排除符仍刷新了被禁职业技能");
  pass("排除符按进度开放双槽且不刷新被禁职业技能");

  const beforeConflict = await state(page);
  const afterConflict = await api(page, "forceConflict40", "glassMagazine40");
  assert.ok(afterConflict.player.attackDamage > beforeConflict.player.attackDamage * 1.35);
  assert.ok(afterConflict.player.maxHp < beforeConflict.player.maxHp * .72);
  assert.equal(afterConflict.player.upgradeChoices, 1);
  pass("冲突升级同时应用显著收益、代价与选择记录");

  const fusionCatalog41 = await api(page, "newFusionCatalog41");
  assert.equal(fusionCatalog41.length, 6);
  assert.ok(fusionCatalog41.every(f => f.pair.length === 2 && f.cost && f.weak.length && f.strong.length));
  const fusionFlag41 = { elementalbeast: "elementalBeast", plagueidol: "plagueIdol", soulgun: "soulGun", nanoninja: "nanoNinja", fleshshrine: "fleshShrine", bloodmage: "bloodMage" };
  for (const fusion of fusionCatalog41) {
    await api(page, "backMenu");
    await api(page, "selectCharacter", "sayo");
    await api(page, "selectStage", 2);
    await api(page, "start");
    await api(page, "dismissDialogue");
    await api(page, "protectPlayer");
    await api(page, "freezeProgression");
    await api(page, "clearCombat");
    await api(page, "spawnEnemyRelative", "normal", 80, 0);
    let fused = await api(page, "forceFusion41", fusion.id);
    assert.equal(fused.build.fusion, fusion.id);
    assert.equal(fused.build.fusionMechanics[fusionFlag41[fusion.id]], true);
    if (["elementalbeast", "plagueidol"].includes(fusion.id)) {
      await page.evaluate(() => window.advanceTime(5000));
      fused = await state(page);
      const expected = fusion.id === "plagueidol" ? "acid" : "spell";
      assert.ok((fused.build.damageSources[expected] || fused.build.damageSources.summon || 0) > 0, `${fusion.id} 周期机制未造成伤害`);
    } else if (fusion.id === "soulgun") {
      let volley;
      for (let i = 0; i < 6; i++) volley = await api(page, "attackNow");
      assert.ok(volley.bullets.some(b => b.source === "soul"), "亡骨枪骑未生成亡魂弹");
    } else if (fusion.id === "nanoninja") {
      fused = await api(page, "dashNow");
      assert.ok((fused.build.damageSources.tech || 0) > 0, "纳米机忍冲刺未触发科技残影");
    } else {
      await api(page, "setPlayerHpRatio", .4);
      const beforeHeal = (await state(page)).player.hp;
      await page.locator("#skill").click();
      fused = await state(page);
      assert.ok(fused.player.hp > beforeHeal, `${fusion.id} 主动技能未触发恢复机制`);
    }
  }
  await api(page, "backMenu");
  await page.locator('[data-open="archive"]').click();
  await page.locator('[data-open="asc"]').click();
  assert.match(await page.locator("#ascList .fusionCount41").textContent(), /24 种/);
  const guideText = await page.locator("#ascList").textContent();
  assert.match(guideText, /成型：凑齐/);
  assert.match(guideText, /代价：9级锁一条分支/);
  assert.match(await page.locator('#ascList [data-guide45="fusion"]').first().textContent(), /成型：/);
  const guideFacts = await api(page, "guideFacts45");
  assert.equal(guideFacts.soulgunArt, "fusions/soulgun/splash.webp");
  assert.match(guideFacts.careerForm, /凑齐/);
  await page.locator("#ascDrawer .close").click();
  pass("六个新增融合均有组合、代价、天敌与独立战斗触发，融合总数达到 24");

  await api(page, "backMenu");
  await api(page, "selectStage", 1);
  await api(page, "start");
  await api(page, "dismissDialogue");
  const ch1Pool = await api(page, "seedProgression45", {
    level: 11,
    careers: ["mech", "magical", "gun", "shrine"],
    skills: ["drone", "star", "multi", "talisman", "rail"],
    aff: { tech: 7 },
    seen: ["shield"],
  });
  assert.equal(ch1Pool.teach, true);
  assert.equal(ch1Pool.eligibleFusion.length, 0);
  assert.equal(ch1Pool.eligibleAsc.length, 0);
  assert.equal(ch1Pool.samples.flat().some(item => item.fusion || item.asc), false);
  await api(page, "finish", false);
  const deathReport = await page.locator("#damageReport").innerText();
  const deathSub = await page.locator("#rsub").innerText();
  const deathRoute = await page.locator("#routeNote").innerText();
  assert.match(deathReport, /本局天敌：结界尸/);
  assert.match(deathReport, /下次优先补|下次先成型一所学校/);
  assert.match(deathSub, /本局天敌|下次优先补|下次先成型/);
  assert.equal(/下次优先补|本局天敌|下次先成型/.test(deathRoute), false, "结局文案被教练句覆盖");
  pass("第一章不刷融合飞升，死亡诊断写出天敌和下次补什么");

  await api(page, "backMenu");
  await api(page, "selectStage", 2);
  await api(page, "start");
  await api(page, "dismissDialogue");
  const ch2Pool = await api(page, "seedProgression45", {
    level: 8,
    careers: ["mech", "magical", "gun", "shrine"],
    skills: ["drone", "star", "multi", "talisman"],
  });
  assert.equal(ch2Pool.teach, false);
  assert.ok(ch2Pool.eligibleFusion.includes("magitech"));
  assert.ok(ch2Pool.eligibleFusion.includes("gunshrine"));
  assert.ok(ch2Pool.samples.every(pool => pool.filter(item => item.fusion).length === 2), "无转职双选时应出两张融合");
  const dualCareer = await api(page, "seedProgression45", {
    level: 9,
    careers: ["mech", "magical", "gun", "shrine"],
    skills: ["drone", "star", "multi", "talisman"],
  });
  assert.ok(dualCareer.samples.every(pool => pool.filter(item => item.career).length === 2));
  assert.ok(dualCareer.samples.every(pool => pool.filter(item => item.fusion).length === 1), "转职双选时仍只出一张融合");
  const ch2Asc = await api(page, "seedProgression45", {
    level: 11,
    careers: ["mech", "gun"],
    skills: ["drone", "multi", "rail"],
    aff: { tech: 7 },
  });
  assert.ok(ch2Asc.eligibleAsc.includes("tech"));
  await api(page, "finish", true);
  assert.match(await page.locator("#damageReport").innerText(), /覆盖缺口：|覆盖较完整/);
  assert.equal(/(覆盖缺口|覆盖较完整)/.test(await page.locator("#routeNote").innerText()), false);
  pass("第二章无转职双选可出两张融合，有转职双选仍只出一张");

  await api(page, "backMenu");
  await api(page, "setBait40", 3, true);
  await api(page, "selectStage", 1);
  await api(page, "start");
  await api(page, "dismissDialogue");
  await api(page, "protectPlayer");
  await api(page, "freezeProgression");
  const baitStart = await state(page);
  assert.equal(baitStart.stageDuration, 124);
  assert.equal(baitStart.player.baitLevel, 3);
  await page.evaluate(() => window.advanceTime(7000));
  const baitPressure = await state(page);
  assert.ok(baitPressure.player.baitSpawns >= 2, `丧尸诱饵额外刷怪不足：${baitPressure.player.baitSpawns}`);
  assert.ok(baitPressure.counts.enemies <= (await api(page, "crowdBudget")).e);
  pass("丧尸诱饵延长波次、提高刷怪与经验机会且不突破实体预算");

  await api(page, "clearCombat");
  await api(page, "protectPlayer");
  await api(page, "freezeProgression");
  const crowd = await api(page, "stressCrowd", 240, 8);
  assert.ok(crowd.budget.e <= 105, `430×932 敌人预算过高：${crowd.budget.e}`);
  assert.ok(crowd.peak <= crowd.budget.e, `怪海突破硬上限：${crowd.peak}/${crowd.budget.e}`);
  assert.ok(crowd.snapshot.counts.bullets <= crowd.budget.b);
  assert.ok(crowd.snapshot.counts.enemyBullets <= crowd.budget.eb);
  assert.ok(crowd.elapsedMs < 4000, `8 秒固定步压力测试过慢：${crowd.elapsedMs.toFixed(0)}ms`);
  await shot(page, "02d-crowd-budget.png");
  pass("怪海屏幕面积预算、实体硬上限与 8 秒压力测试");
  const roleVisuals = await api(page, "enemyRoleVisuals412");
  assert.equal(Object.keys(roleVisuals).length, 11);
  assert.equal(new Set(Object.values(roleVisuals)).size, 11);
  await api(page, "clearCombat");
  for (const [type, dx, dy] of [["fast",-135,-180],["tank",0,-195],["ranged",135,-180],["bomb",-155,-65],["shield",155,-65],["disruptor",-150,70],["purifier",150,70],["specter",-105,175],["decay",0,190],["seal",105,175]]) await api(page, "spawnEnemyRelative", type, dx, dy);
  await page.evaluate(() => window.advanceTime(17));
  await shot(page, "02e-enemy-role-silhouettes.png");
  pass("十一类敌人职责拥有不依赖颜色的独立轮廓附件");

  await api(page, "backMenu");
  await api(page, "selectStage", 1);
  await api(page, "start");
  await api(page, "dismissDialogue");
  await api(page, "protectPlayer");
  await api(page, "freezeProgression");
  const ground1 = await api(page, "lifecycle44");
  assert.equal(ground1.ground, "torii");
  assert.equal(ground1.label, "石板参道");
  assert.match(ground1.hint, /鸟居/);
  assert.ok(ground1.obstacleCount >= 3, `第一章障碍不足：${ground1.obstacleCount}`);
  await page.evaluate(() => window.advanceTime(8000));
  const early = await state(page);
  assert.ok(early.counts.enemies >= 8, `第一章前期在场不足：${early.counts.enemies}`);
  assert.equal(early.stage44.earlyWindow, true);
  assert.ok(early.counts.enemies <= (await api(page, "crowdBudget")).e);
  await shot(page, "02f-ch1-ground.png");
  pass("第一章石板参道、鸟居柱与前二十秒尸潮密度");

  await api(page, "backMenu");
  await api(page, "selectStage", 2);
  await api(page, "start");
  await api(page, "dismissDialogue");
  assert.equal((await api(page, "lifecycle44")).ground, "neon");
  await api(page, "backMenu");
  await api(page, "selectStage", 3);
  await api(page, "start");
  await api(page, "dismissDialogue");
  assert.equal((await api(page, "lifecycle44")).ground, "swords");
  await api(page, "backMenu");
  await api(page, "selectStage", 4);
  await api(page, "start");
  await api(page, "dismissDialogue");
  assert.equal((await api(page, "lifecycle44")).ground, "mirror");
  await shot(page, "02g-ch4-mirror.png");
  pass("四章地面身份互不相同");

  const paused = await api(page, "pauseNow");
  assert.equal(paused.mode, "pause");
  assert.match(await page.locator("#build").innerText(), /尚未成型职业|未转职|职业/);
  const tree = await api(page, "careerProgress44");
  assert.ok(Array.isArray(tree.schools));
  await page.locator("#resume").click();
  pass("暂停页显示职业学校进度");

  await api(page, "backMenu");
  await api(page, "selectCharacter", "sayo");
  await api(page, "start");
  await api(page, "dismissDialogue");
  await api(page, "clearCombat");
  await api(page, "spawnEnemyRelative", "normal", 0, -180);
  const aimedShot = await api(page, "attackNow");
  const bullet = aimedShot.bullets[0];
  const bulletLength = Math.hypot(bullet.vx, bullet.vy);
  const aim = aimedShot.snapshot.player.aim;
  assert.ok(bullet.vy < 0 && Math.abs(bullet.vx) < 0.001, "上方目标的子弹方向错误");
  assert.ok((bullet.vx / bulletLength) * aim.x + (bullet.vy / bulletLength) * aim.y > 0.995, "枪身朝向必须与弹道共线");
  assert.equal(aimedShot.snapshot.player.direction, "up");
  pass("自动锁定最近敌人且枪身与弹道严格共线");

  await api(page, "backMenu");
  await api(page, "selectCharacter", "rion");
  await api(page, "start");
  await api(page, "dismissDialogue");
  await api(page, "clearCombat");
  await api(page, "spawnEnemyRelative", "normal", 100, 0);
  await api(page, "spawnEnemyRelative", "normal", -100, 0);
  const slash = await api(page, "attackNow");
  assert.ok(slash.enemies[0].hp < slash.enemies[0].max, "前方敌人应受到太刀伤害");
  assert.equal(slash.enemies[1].hp, slash.enemies[1].max, "身后敌人不应受到太刀伤害");
  assert.equal(await api(page, "directionalHit", 145, 18, 128, 0, 1.05), true);
  assert.equal(await api(page, "directionalHit", 147, 18, 128, 0, 1.05), false);
  assert.equal(await api(page, "directionalHit", 100, 18, 128, Math.PI, 1.05), false);
  pass("太刀伤害仅覆盖面向挥砍扇形及正确距离");

  for (const id of ["sayo", "aya", "rion"]) {
    const eggs = await api(page, "characterEggCatalog", id);
    assert.equal(Object.keys(eggs).length, 8, `${id} 独立彩蛋不足 8 条`);
    assert.equal(new Set(Object.values(eggs).flat(2)).size >= 8, true);
  }
  pass("三角色各八个独立触发型吐槽彩蛋");

  const storyFlags = {
    aya: ["ayaSignal", "ayaOrder", "ayaDoor", "ayaSister", "ayaBlade", "ayaMemory", "ayaTruth", "ayaFinal"],
    rion: ["rionTrail", "rionNames", "rionModel", "rionScroll", "rionLedger", "rionHeir", "rionMaster", "rionFinal"],
  };
  const storyTitles = new Set();
  for (const id of ["aya", "rion"]) {
    for (let stageId = 1; stageId <= 4; stageId++) {
      for (let eventId = 0; eventId < 2; eventId++) {
        await api(page, "backMenu");
        await api(page, "selectCharacter", id);
        await api(page, "selectStage", stageId);
        await api(page, "start");
        await api(page, "dismissDialogue");
        const event = await api(page, "openCharacterEvent", eventId);
        assert.ok(event.title.length >= 4);
        assert.ok(event.text.length >= 8);
        assert.equal(event.choices.length, 2);
        storyTitles.add(event.title);
        const choice = await api(page, "chooseEvent", 0);
        assert.equal(choice.snapshot.mode, "play");
        assert.ok(choice.storyFlags[storyFlags[id][(stageId - 1) * 2 + eventId]]);
      }
    }
  }
  assert.equal(storyTitles.size, 16, "角色专属事件标题不应复用");
  const persistentStory = await api(page, "storyMemory");
  assert.equal(Object.keys(persistentStory.aya).length >= 8, true, "绫的剧情选择应跨章节保存");
  assert.equal(Object.keys(persistentStory.rion).length >= 8, true, "凛音的剧情选择应跨章节保存");
  assert.match((await api(page, "endingPreview")).name, /写定的结局/);
  await api(page, "backMenu");
  await api(page, "selectCharacter", "aya");
  await api(page, "selectStage", 4);
  await api(page, "start");
  await api(page, "dismissDialogue");
  await api(page, "setStoryFlag", "ayaFinal", "free");
  assert.match((await api(page, "endingPreview")).name, /写定的结局/);
  const seeded = await api(page, "seedHiddenRoute47");
  assert.equal(seeded.ready, true, "八步线索与前三章通关后才可进隐藏关");
  assert.match((await api(page, "endingPreview")).name, /写定的结局/, "隐藏关打完前仍是写定结局");
  const perfect = await api(page, "setHiddenCleared47", true);
  assert.match(perfect.name, /姐妹归还/);
  pass("绫与凛音各八段专属抉择、跨章节记忆；完美结局要隐藏关");

  const pressure = await api(page, "directorProbe", 18, 74);
  const breath = await api(page, "directorProbe", 25, 74);
  const planned = await api(page, "directorProbe", 88, 96);
  const scattered = await api(page, "directorProbe", 88, 38);
  assert.ok(breath.intensity < pressure.intensity * 0.75, "喘息期压力应显著低于波峰");
  assert.ok(planned.factor < scattered.factor, "合理构筑应降低导演压强");
  pass("30 秒压力—喘息周期与构筑压强反馈");

  await api(page, "backMenu");
  await api(page, "selectCharacter", "sayo");
  await api(page, "selectStage", 1);
  const testimony = await api(page, "setRunMode46", "testimony");
  assert.equal(testimony.runMode, "testimony");
  await api(page, "start");
  await api(page, "dismissDialogue");
  await api(page, "protectPlayer");
  await api(page, "triggerUpgrade");
  assert.equal((await state(page)).mode, "play");
  assert.equal(await page.locator("#level").isVisible(), false);
  assert.match(await page.locator("#stageHud").textContent(), /证词/);
  pass("证词模式升级不弹卡，战斗继续");

  await api(page, "backMenu");
  await api(page, "selectCharacter", "sayo");
  await api(page, "setRunMode46", "story");
  await api(page, "selectStage", 1);
  await api(page, "start");
  await api(page, "dismissDialogue");
  await api(page, "protectPlayer");
  const beforeUpgrade = await state(page);
  await api(page, "triggerUpgrade");
  assert.equal((await state(page)).mode, "level");
  assert.equal(await page.locator("#dialogue").evaluate(node => node.classList.contains("hidden")), true);
  assert.equal(await page.locator("#banter").evaluate(node => node.classList.contains("hidden")), true);
  assert.ok(await page.locator("#choices .choice").count() >= 1);
  assert.equal(await page.locator("#choices .choiceReadout38").count(), await page.locator("#choices .choice").count());
  assert.match(await page.locator("#choices .choiceReadout38").first().innerText(), /→/);
  await page.waitForFunction(() => [...document.querySelectorAll("#choices .choice>img")].every(image => image.complete && image.naturalWidth > 0));
  assert.ok(await page.locator("#choices .choice>img").evaluateAll(images => images.every(image => image.src.includes("/game/art/"))));
  await shot(page, "03-upgrade-modal.png");
  await api(page, "chooseUpgrade", 0);
  await page.evaluate(() => window.advanceTime(500));
  const afterUpgrade = await state(page);
  assert.equal(afterUpgrade.mode, "play");
  assert.equal(afterUpgrade.player.level, beforeUpgrade.player.level + 1);
  assert.equal(afterUpgrade.build.upgradeOrder.length, beforeUpgrade.build.upgradeOrder.length + 1);
  pass("升级选择后恢复战斗");

  await api(page, "spawnBossNow");
  assert.equal((await state(page)).mode, "dialogue");
  await api(page, "dismissDialogue");
  assert.equal((await state(page)).boss.phase, 1);
  await api(page, "setBossPosition", -180, 220);
  assert.equal((await state(page)).boss.pointerVisible, true, "离屏 Boss 应显示方向指针");
  await shot(page, "03b-offscreen-boss-pointer.png");
  await api(page, "setBossPosition", 215, 200);
  for (const [ratio, phase] of [[0.75, 2], [0.50, 3], [0.25, 4]]) {
    await api(page, "setBossHpRatio", ratio);
    await page.evaluate(() => window.advanceTime(17));
    const phaseState = await state(page);
    assert.equal(phaseState.boss.phase, phase);
    assert.equal(phaseState.mode, "dialogue");
    const phaseVisual = await api(page, "bossVisualState412");
    assert.equal(phaseVisual.previous, phase - 1);
    assert.ok(phaseVisual.transform > 1);
    await api(page, "dismissDialogue");
    assert.equal((await state(page)).mode, "play");
    if (phase === 2) await shot(page, "04a-boss-transform.png");
  }
  await shot(page, "04-boss-phase-4.png");
  pass("Boss 75%/50%/25% 三次转阶段并播放阶段图交叉变身与场地演出");

  await api(page, "defeatBoss");
  assert.equal((await state(page)).mode, "dialogue");
  assert.equal(await page.locator("#storyBeat44:not(.hidden)").count(), 1);
  assert.match(await page.locator("#storyBeat44").innerText(), /倒下|碎裂|净化/);
  assert.equal((await api(page, "cutscene44")).playing, true);
  await shot(page, "05a-victory-cutscene.png");
  await api(page, "dismissDialogue");
  let resultState = await state(page);
  assert.equal(resultState.mode, "result");
  assert.equal(resultState.result.win, true);
  assert.match(resultState.result.title, /净化/);
  assert.ok((await page.locator("#damageReport").innerText()).length > 0);
  await shot(page, "05-victory-result.png");
  pass("Boss 胜利结算与构筑报告");

  for (const stageId of [2, 3, 4]) {
    await api(page, "backMenu");
    await api(page, "selectStage", stageId);
    await api(page, "start");
    await api(page, "dismissDialogue");
    await api(page, "protectPlayer");
    await api(page, "spawnBossNow");
    await api(page, "dismissDialogue");
    for (const [ratio, phase] of [[0.75, 2], [0.50, 3], [0.25, 4]]) {
      await api(page, "setBossHpRatio", ratio);
      await page.evaluate(() => window.advanceTime(17));
      assert.equal((await state(page)).boss.phase, phase, `第 ${stageId} 章 Boss 阶段错误`);
      await api(page, "dismissDialogue");
    }
  }
  pass("第二至第四章 Boss 三次转阶段");

  await api(page, "backMenu");
  await api(page, "selectStage", 1);
  await api(page, "start");
  await api(page, "dismissDialogue");
  assert.equal((await state(page)).mode, "play");
  await api(page, "killPlayer");
  resultState = await state(page);
  assert.equal(resultState.mode, "result");
  assert.equal(resultState.result.win, false);
  assert.match(resultState.result.title, /失守/);
  await shot(page, "06-defeat-result.png");
  await page.locator("#back").click();
  assert.equal((await state(page)).mode, "menu");
  await page.locator("#start").click();
  await api(page, "dismissDialogue");
  assert.equal((await state(page)).mode, "play");
  pass("死亡结算、返回菜单、再次开局");

  await api(page, "backMenu");
  const beforeMainGod = await api(page, "saveSnapshot");
  await api(page, "unlockMainGod");
  assert.equal(await page.locator(".mainGodCard36").count(), 1);
  await page.locator('[data-open="stage"]').click();
  await page.locator(".mainGodCard36 .exchange36").click();
  assert.equal(await page.locator("#mainGodDrawer36").isVisible(), true);
  assert.equal(await page.locator("#mainGodShopList36 .exchangeCard36").count(), 14);
  assert.equal(await page.locator("#mgReset37").count(), 1);
  await shot(page, "08-main-god-shop.png");
  await page.locator("#mainGodDrawer36 .close").click();
  await api(page, "grantMainGodPoints", 60);
  const purchase = await api(page, "buyMainGodUpgrade", "power");
  assert.equal(purchase.bought, true);
  assert.equal(purchase.snapshot.mainGod.power, 1);
  assert.equal(purchase.snapshot.mainGod.points, beforeMainGod.mainGod.points + 57);
  const itemPurchase = await api(page, "buyMainGodItem", "spaceRing");
  assert.equal(itemPurchase.bought, true);
  assert.equal(itemPurchase.snapshot.mainGod.spaceRing, 1);
  assert.equal(itemPurchase.snapshot.mainGod.points, beforeMainGod.mainGod.points + 35);
  const cursedPurchase = await api(page, "buyMainGodItem", "cursedHeart");
  assert.equal(cursedPurchase.bought, true);
  assert.equal(cursedPurchase.snapshot.mainGod.cursedHeart, 1);
  assert.equal(cursedPurchase.snapshot.mainGod.points, beforeMainGod.mainGod.points + 11);
  await api(page, "selectCharacter", "sayo");
  await api(page, "selectMainGodTier", 1);
  await api(page, "start");
  await shot(page, "08-main-god-opening.png");
  await api(page, "dismissDialogue");
  let mainGodState = await state(page);
  assert.equal(mainGodState.runMode, "mainGod");
  assert.equal(mainGodState.stageKey, "mainGod-1");
  assert.ok(mainGodState.player.attackDamage > baseCombat.sayo.attackDamage);
  assert.ok(mainGodState.player.maxHp < baseCombat.sayo.maxHp * 1.25, "诅咒遗物应以生命上限换取伤害");
  await page.evaluate(() => window.advanceTime(250));
  assert.equal((await state(page)).mode, "event");
  assert.match(await page.locator("#eventTitle").textContent(), /主神随机契约/);
  assert.equal(await page.locator("#eventChoices .eventChoice").count(), 3);
  await api(page, "chooseEvent", 0);
  for (let i = 0; i < 5; i++) {
    await api(page, "triggerUpgrade");
    assert.equal((await state(page)).mode, "level");
    await api(page, "chooseUpgrade", 0);
  }
  mainGodState = await state(page);
  assert.equal(mainGodState.player.level, 6);
  assert.ok(mainGodState.player.multishot >= 4, "主神空间兑换道具与五级成长应追加弹幕");
  assert.ok(mainGodState.player.pierce >= 2, "主神空间三级成长应追加穿透");
  await api(page, "protectPlayer");
  await api(page, "freezeProgression");
  await api(page, "spawnEnemyNear", "normal", 120);
  await page.evaluate(() => window.advanceTime(1800));
  await shot(page, "08-main-god-growth-battle.png");
  const mainEvent1 = await api(page, "openCharacterEvent", 0);
  assert.match(mainEvent1.title, /主神契约/);
  assert.equal(mainEvent1.choices.length, 2);
  await api(page, "chooseEvent", 0);
  const mainEvent2 = await api(page, "openCharacterEvent", 1);
  assert.match(mainEvent2.title, /预测删除/);
  await api(page, "chooseEvent", 1);
  await api(page, "protectPlayer");
  await api(page, "spawnBossNow");
  await api(page, "dismissDialogue");
  assert.match((await state(page)).boss.rule, /轮回校验/);
  for (const [ratio, phase] of [[0.75, 2], [0.50, 3], [0.25, 4]]) {
    await api(page, "setBossHpRatio", ratio);
    await page.evaluate(() => window.advanceTime(17));
    assert.equal((await state(page)).boss.phase, phase);
    await api(page, "dismissDialogue");
  }
  const pointsBeforeClear = (await state(page)).mainGod.points;
  await api(page, "defeatBoss");
  await api(page, "dismissDialogue");
  mainGodState = await state(page);
  const afterMainGod = await api(page, "saveSnapshot");
  assert.equal(mainGodState.mode, "result");
  assert.equal(mainGodState.result.win, true);
  assert.ok(afterMainGod.mainGod.points >= pointsBeforeClear + 12);
  assert.ok(afterMainGod.mainGod.unlockedTier >= 2);
  assert.equal(afterMainGod.coins, beforeMainGod.coins, "主神空间不应发放普通樱花币");
  assert.deepEqual(afterMainGod.story, beforeMainGod.story, "主神空间不应污染四章剧情存档");
  assert.deepEqual(afterMainGod.endings, beforeMainGod.endings, "主神空间不应写入普通结局");
  await shot(page, "08-main-god-result.png");
  pass("主神空间强化、两次契约、四阶段 Boss 与独立奖励结算");

  await api(page, "backMenu");
  await api(page, "selectMainGodTier", 4);
  await api(page, "start");
  await api(page, "dismissDialogue");
  await page.evaluate(() => window.advanceTime(250));
  await api(page, "chooseEvent", 0);
  assert.match((await state(page)).stageKey, /^mainGod-4-1$/);
  await api(page, "finish", true);
  assert.equal((await api(page, "saveSnapshot")).mainGod.deepest, 1);
  pass("T3 后无限回廊逐层推进");

  await api(page, "backMenu");
  await api(page, "selectStage", 1);
  await api(page, "start");
  await api(page, "dismissDialogue");
  const cleanStoryRun = await state(page);
  assert.equal(cleanStoryRun.runMode, "story");
  assert.equal(cleanStoryRun.player.multishot, 1, "主神兑换不得带入普通四章");
  assert.deepEqual(cleanStoryRun.build.upgrades, {}, "上一轮局内升级不得保留");
  pass("主神兑换跨轮回保留、局内构筑清空且不污染普通关卡");

  await api(page, "setBait40", 0, false);
  await api(page, "setBannedSchools40", []);
  const loneDurations = {};
  for (const character of ["sayo", "aya", "rion"]) {
    await api(page, "backMenu");
    await api(page, "configureStarter40", "assault", 5, true);
    await api(page, "selectCharacter", character);
    await api(page, "selectStage", 4);
    await api(page, "reseed40", 0x40c0de);
    await api(page, "start");
    await api(page, "dismissDialogue");
    await api(page, "protectPlayer");
    let loneState = await state(page);
    for (let guard = 0; guard < 100 && loneState.mode !== "result"; guard++) {
      if (loneState.mode === "event") await api(page, "chooseEvent", 0);
      else if (loneState.mode === "dialogue") await api(page, "dismissDialogue");
      else if (loneState.mode === "level") throw new Error("孤证试炼不应打开局内升级选择");
      else if (loneState.mode === "play") {
        if (loneState.player.skillCooldown <= 0) await page.locator("#skill").click();
        await page.evaluate(() => window.advanceTime(5000));
      }
      loneState = await state(page);
    }
    assert.equal(loneState.mode, "result", `${character} 终章纯初始强化未能在时限内完成`);
    assert.equal(loneState.result.win, true);
    assert.match(loneState.result.title, /孤证者/);
    assert.equal(loneState.player.upgradeChoices, 0);
    assert.equal(loneState.build.upgradeOrder.length, 0);
    loneDurations[character] = loneState.runTime;
    if (character === "sayo") await shot(page, "09-lone-proof-result.png");
  }
  const loneSave = await api(page, "saveSnapshot");
  assert.equal(loneSave.ach.loneproof, true);
  assert.deepEqual(Object.keys(loneSave.hiddenStory40).sort(), ["aya", "rion", "sayo"]);
  assert.ok((await api(page, "balanceReport40")).samples >= 3);
  assert.ok(Math.max(...Object.values(loneDurations)) / Math.min(...Object.values(loneDurations)) < 1.30, `三角色纯初始通关时间差超过 30%：${JSON.stringify(loneDurations)}`);
  pass(`三角色终章纯初始强化通关：小夜${loneDurations.sayo.toFixed(0)}秒 / 绫${loneDurations.aya.toFixed(0)}秒 / 凛音${loneDurations.rion.toFixed(0)}秒`);

  dropMissingOutfitConsoleErrors(tracker);
  assert.equal(tracker.pageErrors.length, 0, tracker.pageErrors.join("\n"));
  assert.equal(tracker.consoleErrors.length, 0, tracker.consoleErrors.join("\n"));
  assert.equal(tracker.externalRequests.length, 0, tracker.externalRequests.join("\n"));
  pass("核心流程无控制台错误且无外部网络请求");

  await api(page, "triggerError", "error");
  await page.waitForTimeout(50);
  await api(page, "triggerError", "promise");
  await page.waitForTimeout(50);
  const devState = await state(page);
  assert.equal(devState.devErrors, 2);
  assert.equal(await page.locator("#devErrorPanel").isVisible(), true);
  const panelText = await page.locator("#devErrorText").innerText();
  assert.match(panelText, /SMOKE_EXPECTED_RUNTIME_ERROR/);
  assert.match(panelText, /SMOKE_EXPECTED_PROMISE_ERROR/);
  await shot(page, "07-dev-error-panel.png");
  const unexpectedPageErrors = tracker.pageErrors.filter(item => !item.includes("SMOKE_EXPECTED"));
  const unexpectedConsoleErrors = tracker.consoleErrors.filter(item => !item.includes("SMOKE_EXPECTED"));
  assert.equal(unexpectedPageErrors.length, 0, unexpectedPageErrors.join("\n"));
  assert.equal(unexpectedConsoleErrors.length, 0, unexpectedConsoleErrors.join("\n"));
  pass("同步异常与 Promise 拒绝均显示开发错误面板");

  const report = {
    source,
    sourceSha256: createHash("sha256").update(fs.readFileSync(sourceFile)).digest("hex"),
    viewport: { width: 430, height: 932, isMobile: true, hasTouch: true },
    passed,
    screenshots: screenshots.map(item => path.relative(projectRoot, item)),
    expectedErrors: tracker.pageErrors.filter(item => item.includes("SMOKE_EXPECTED")),
    externalRequests: tracker.externalRequests,
    completedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(artifactDir, "report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(`SMOKE PASS ${passed.length} checks`);
} finally {
  if (normalContext) await normalContext.close();
  if (legacyContext) await legacyContext.close();
  if (mainContext) await mainContext.close();
  await browser.close();
}

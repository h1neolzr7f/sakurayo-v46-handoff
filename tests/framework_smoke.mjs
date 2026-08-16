import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function loadPlaywright() {
  try { return await import("playwright"); }
  catch {
    const fallback = path.join(os.homedir(), ".codex", "skills", "develop-web-game", "scripts", "node_modules", "playwright", "index.mjs");
    return await import(pathToFileURL(fallback).href);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceArg = process.argv[2] || "src/index.html";
const source = /^https?:\/\//i.test(sourceArg) ? sourceArg : pathToFileURL(path.resolve(root, sourceArg)).href;
const testUrl = `${source}?test=1&debug=1`;
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const output = path.join(root, "tests/artifacts/framework");
const runtimeCode = fs.readFileSync(path.join(root, "src/runtime/sakurayo-content-runtime.js"), "utf8");
fs.mkdirSync(output, { recursive: true });
const passed = [];

function pass(name) { passed.push(name); console.log(`PASS ${name}`); }
async function waitReady(page) {
  await page.goto(testUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".bootArt35").waitFor({ state: "detached", timeout: 8000 });
  assert.equal(await page.locator("#menu").isVisible(), true);
}
async function api(page, method, ...args) {
  return page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
}

try {
  const oldContext = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await oldContext.addInitScript(() => localStorage.setItem("sakurayoV3", JSON.stringify({ coins: 90, tal: { atk: 1 }, extensions: { "official.story-exploration": { __version: 1, data: { collected: { legacy: true }, visits: {}, fragments: [] } } } })));
  const oldPage = await oldContext.newPage();
  await waitReady(oldPage);
  const oldSave = await api(oldPage, "saveSnapshot");
  assert.equal(oldSave.coins, 90);
  assert.equal(oldSave.tal.atk, 1);
  assert.equal(oldSave.extensions["official.framework-example"].__version, 1);
  assert.deepEqual(oldSave.extensions["official.framework-example"].data.purchases, {});
  assert.equal(oldSave.extensions["official.story-exploration"].__version, 2);
  assert.deepEqual(oldSave.extensions["official.story-exploration"].data.choices, {});
  assert.equal(oldSave.extensions["official.story-exploration"].data.collected.legacy, true);
  assert.ok(oldSave.shop40 && oldSave.shop40.ops, "旧存档应补齐 shop40.ops");
  const oldLobby = await api(oldPage, "lobby46");
  assert.ok(oldLobby.shown.includes("sayo_echo"));
  assert.ok(oldLobby.shown.includes("aya_petal"));
  assert.equal(oldLobby.coins, 90, "旧存档樱花币不应被寻访字段清空");
  pass("旧 sakurayoV3 存档保留并补齐扩展默认字段");

  const status = await api(oldPage, "extensionStatus41");
  assert.deepEqual(status.packs.map(pack => pack.id), ["official.framework-example", "official.story-exploration", "official.feedback", "official.modkit-addon", "official.maingod-void"]);
  assert.equal(status.packs.every(pack => pack.enabled), true);
  assert.equal(status.packs.every(pack => pack.apiVersion === 2), true);
  assert.deepEqual(status.packs.find(pack => pack.id === "official.modkit-addon").dependencies, [{ id: "official.framework-example", minVersion: 1 }]);
  assert.equal(status.errors.length, 0);
  assert.equal(status.costumes.some(item => item.id === "framework_observer"), true);
  assert.equal(status.achievements.some(item => item.id === "observer_wardrobe"), true);
  const feedbackAssets = await oldPage.evaluate(() => window.SakurayoContent.assets("official.feedback"));
  assert.match(feedbackAssets.audio.reward, /reward\.ogg$/);
  assert.match(feedbackAssets.vfx.muzzle, /muzzle\.png$/);
  const lifecycleHooks = await oldPage.evaluate(() => window.SakurayoContent.hookStatus());
  assert.deepEqual(lifecycleHooks["combat:after-draw"].map(entry => entry.owner), ["core.ops46", "core.boss-pointer38", "core.outfit-reveal45", "core.fusion-action46", "core.mechanics39", "core.boss-stage412"]);
  assert.equal(lifecycleHooks["combat:after-update"].some(entry => entry.owner === "core.boss-art412"), true);
  pass("官方扩展通过注册表提供服饰、商店、成就和档案数据");

  await oldPage.locator('[data-open="shop"]').click();
  const costume = oldPage.locator(".skinCard", { hasText: "薄樱观测服" });
  await costume.waitFor();
  await oldPage.waitForFunction(() => {
    const cards = [...document.querySelectorAll(".skinCard")];
    const card = cards.find(node => node.textContent.includes("薄樱观测服"));
    const image = card?.querySelector("img");
    return image?.complete && image.naturalWidth > 0;
  });
  assert.equal(await costume.locator("img").evaluate(image => image.complete && image.naturalWidth > 0), true);
  await costume.locator("button").click();
  const afterCostume = await api(oldPage, "saveSnapshot");
  assert.equal(afterCostume.ownedSkins.includes("framework_observer"), true);
  assert.equal(afterCostume.ach["official.framework-example:observer_wardrobe"], true);
  pass("示例服饰资源可解码、购买并触发扩展成就");

  await oldPage.locator('.shopTabs40 [data-shop="extensions"]').click();
  const item = oldPage.locator('[data-shop-group="extensions"] .shopItem40', { hasText: "扩展观测手册" });
  await item.locator("button").click();
  await oldPage.locator('.shopTabs40 [data-shop="extensions"]').click();
  const addonItem = oldPage.locator('[data-shop-group="extensions"] .shopItem40', { hasText: "Mod Kit 校验符" });
  await addonItem.locator("button").click();
  const afterItem = await api(oldPage, "saveSnapshot");
  assert.equal(afterItem.extensions["official.framework-example"].data.purchases.observer_manual, 1);
  assert.equal(afterItem.extensions["official.modkit-addon"].data.purchases.modkit_seal, 1);
  assert.equal(afterItem.ach["official.modkit-addon:dependency_ready"], true);
  await oldPage.locator("#shopDrawer .close").click();
  // story 已收入档案抽屉；shop 仍在主 nav。抽屉未挂上时可用 api(oldPage, "openDrawer", "story")
  await oldPage.locator('[data-open="archive"]').click();
  await oldPage.locator('[data-open="story"]').click();
  assert.equal(await oldPage.locator(".extensionStory41", { hasText: "不动核心的第四条路" }).count(), 1);
  assert.equal(await oldPage.locator(".extensionStory41", { hasText: "依赖不是加载顺序" }).count(), 1);
  await oldPage.screenshot({ path: path.join(output, "official-example.png"), fullPage: true });
  pass("扩展商店状态独立持久化并解锁扩展档案");

  await oldPage.locator("#storyDrawer .close").click();
  const exploration = await api(oldPage, "openExploration41", 1);
  assert.equal(exploration.opened, true);
  assert.equal(exploration.snapshot.visualSize, 118);
  assert.equal(exploration.snapshot.collisionRadius, 16);
  assert.equal(exploration.snapshot.walkableZones, 5);
  assert.equal(exploration.snapshot.total, 3);
  const movedLeft = await api(oldPage, "explorationStep41", -1, 0, .15);
  assert.equal(movedLeft.facing, "left");
  assert.equal(movedLeft.moving, true);
  await oldPage.waitForFunction(() => {
    const canvas = document.querySelector("#exploreCanvas41");
    return canvas && canvas.width > 0 && !document.querySelector("#exploration41").classList.contains("hidden");
  });
  const beforeReward = await api(oldPage, "saveSnapshot");
  const collected = await api(oldPage, "collectExplorationNode41", "torii-cache");
  const afterReward = await api(oldPage, "saveSnapshot");
  assert.equal(collected.collected.includes("torii-cache"), true);
  assert.equal(afterReward.coins, beforeReward.coins + 12);
  const boundary = await api(oldPage, "explorationStep41", -1, 0, 3);
  assert.ok(boundary.blockedMoves > 0);
  await api(oldPage, "collectExplorationNode41", "seal-fragment");
  const beforeEvent = await api(oldPage, "saveSnapshot");
  const event = await api(oldPage, "triggerExplorationEvent41", "echo-altar");
  assert.equal(event.opened, true);
  assert.equal(event.snapshot.activeEvent, "echo-altar");
  await oldPage.screenshot({ path: path.join(output, "chapter1-exploration-event.png"), fullPage: true });
  const eventChoice = await api(oldPage, "chooseExplorationEvent41", "preserve");
  const afterEvent = await api(oldPage, "saveSnapshot");
  assert.equal(eventChoice.chosen, true);
  assert.equal(eventChoice.snapshot.eventsCompleted.includes("echo-altar"), true);
  assert.equal(eventChoice.snapshot.total, 4);
  assert.equal(afterEvent.coins, beforeEvent.coins + 10);
  await oldPage.screenshot({ path: path.join(output, "chapter1-exploration.png"), fullPage: true });
  await api(oldPage, "closeExploration41");
  assert.equal((await api(oldPage, "saveSnapshot")).extensions["official.story-exploration"].data.collected["shrine-outskirts:torii-cache"], true);
  pass("Image2 剧情地图具备可行走边界、线索门槛、分支事件、隐藏奖励与跨菜单持久化");
  await oldContext.close();

  const contractPage = await browser.newPage();
  await contractPage.addScriptTag({ content: runtimeCode });
  const contract = await contractPage.evaluate(() => {
    const content = window.SakurayoContent;
    const compileIsolated = content.loadBundledPack("fixture.syntax/pack.js", "function {");
    const invalidReference = content.register({
      id: "contract.invalid", version: 1, apiVersion: 2,
      explorations: [{ id: "bad-map", stageId: 1, title: "bad", background: "content-packs/contract-invalid/maps/map.webp", spawn: [.5, .5], nodes: [{ id: "cache", x: .5, y: .5, reward: { type: "coins", amount: 1 }, requiresEvent: "missing" }] }]
    });
    content.register({
      id: "contract.addon", version: 1, apiVersion: 2, dependencies: [{ id: "contract.base", minVersion: 1 }],
      stories: [{ id: "after-base", n: "after", d: "after", unlock: { type: "always" } }]
    });
    content.register({
      id: "contract.base", version: 1, apiVersion: 2,
      explorations: [{
        id: "doc-map", stageId: 1, title: "doc", background: "content-packs/contract-base/maps/map.webp", spawn: [.5, .5],
        walkable: [{ type: "circle", x: .5, y: .5, radius: .25 }],
        nodes: [{ id: "clue", x: .5, y: .5, reward: { type: "coins", amount: 1 } }, { id: "hidden", x: .5, y: .5, requiresEvent: "echo", reward: { type: "fragment", value: "hidden" } }],
        events: [{ id: "echo", x: .5, y: .5, requiresNode: "clue", choices: [{ id: "keep", label: "keep", result: "kept", reward: { type: "coins", amount: 7 } }, { id: "archive", label: "archive", reward: { type: "fragment", value: "证词" } }] }]
      }]
    });
    content.register({ id: "contract.gap", version: 3, apiVersion: 2, saveDefaults: { safe: true }, migrations: [{ from: 2, to: 3, set: { reached: true } }] });
    content.finalize();
    let hookContinued = 0;
    content.hook("contract:after", () => { throw new Error("expected hook failure"); }, "contract.base", 1);
    content.hook("contract:after", () => { hookContinued++; }, "contract.addon", 2);
    content.runHooks("contract:after", { value: 1 });
    const scene = content.content("explorations")[0];
    const migrated = content.migrateSave({ extensions: { "contract.gap": { __version: 1, data: { keep: 9 } } } });
    return {
      compileIsolated, invalidReference, packs: content.packs(), scene,
      storyOrder: content.content("stories").map(entry => entry.__packId),
      gap: migrated.extensions["contract.gap"], hookContinued,
      errors: content.errors(), hooks: content.hookStatus()
    };
  });
  assert.equal(contract.compileIsolated, false);
  assert.equal(contract.invalidReference, false);
  assert.equal(contract.scene.walkable[0].r, .25);
  assert.equal(contract.scene.events[0].choices[0].description, "kept");
  assert.equal(contract.scene.events[0].choices[0].coins, 7);
  assert.equal(contract.scene.events[0].choices[1].fragment, "证词");
  assert.deepEqual(contract.storyOrder, ["contract.addon"]);
  assert.equal(contract.gap.__disabled, true);
  assert.equal(contract.gap.data.keep, 9);
  assert.equal(contract.hookContinued, 1);
  assert.equal(contract.hooks["contract:after"].length, 2);
  assert.ok(contract.errors.some(error => error.phase === "compile"));
  assert.ok(contract.errors.some(error => error.packId === "contract.invalid" && error.phase === "register"));
  assert.ok(contract.errors.some(error => error.packId === "contract.gap" && error.phase === "migration"));
  assert.ok(contract.errors.some(error => error.phase === "hook:contract:after"));
  pass("Mod Kit 契约统一文档格式、依赖排序、逐版本迁移、Hook 与单包编译隔离");
  await contractPage.close();

  const brokenContext = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  const pageErrors = [];
  const brokenPage = await brokenContext.newPage();
  brokenPage.on("pageerror", error => pageErrors.push(String(error)));
  await brokenPage.goto(`${source}?test=1&debug=1&brokenExtension=1`, { waitUntil: "domcontentloaded" });
  await brokenPage.locator(".bootArt35").waitFor({ state: "detached", timeout: 8000 });
  assert.equal(await brokenPage.locator("#menu").isVisible(), true);
  const brokenStatus = await api(brokenPage, "extensionStatus41");
  assert.deepEqual(brokenStatus.packs.map(pack => pack.id), ["official.framework-example", "official.story-exploration", "official.feedback", "official.modkit-addon", "official.maingod-void"]);
  assert.ok(brokenStatus.errors.some(error => error.packId === "fixture.broken-content" && error.phase === "register"));
  assert.equal(pageErrors.length, 0);
  pass("非法扩展被隔离，本体和其他扩展继续启动");
  await brokenContext.close();

  const poisonContext = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await poisonContext.addInitScript(() => localStorage.setItem("sakurayoV3", '{"coins":12,"tal":{"atk":2},"mainGod":{"points":3},"extraJunk424":1,"__proto__":{"pollutedSakurayo":true}}'));
  const poisonPage = await poisonContext.newPage();
  await poisonPage.goto(testUrl, { waitUntil: "domcontentloaded" });
  await poisonPage.locator(".bootArt35").waitFor({ state: "detached", timeout: 8000 });
  assert.equal(await poisonPage.evaluate(() => ({}).pollutedSakurayo), undefined);
  const poisonSave = await api(poisonPage, "saveSnapshot");
  assert.equal(poisonSave.coins, 12);
  assert.equal(poisonSave.tal.atk, 2);
  assert.equal(poisonSave.extraJunk424, undefined);
  pass("存档 merge 忽略 __proto__ 并丢掉未知顶层字段");
  await poisonContext.close();

  fs.writeFileSync(path.join(output, "report.json"), JSON.stringify({ passed, completedAt: new Date().toISOString() }, null, 2));
  console.log(`FRAMEWORK SMOKE PASS ${passed.length} checks`);
} finally {
  await browser.close();
}

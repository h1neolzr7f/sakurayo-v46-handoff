import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "path";
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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = pathToFileURL(path.resolve(root, "src/index.html")).href;
const testUrl = `${source}?test=1&debug=1`;
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const passed = [];

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

async function waitMenu(page) {
  await page.goto(testUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".bootArt35").waitFor({ state: "detached", timeout: 8000 });
  assert.equal(await page.locator("#menu").isVisible(), true);
}

try {
  const fresh = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  const freshPage = await fresh.newPage();
  await waitMenu(freshPage);
  assert.equal(await freshPage.evaluate(() => localStorage.getItem("sakurayoV3") !== null), true);
  const freshSave = await api(freshPage, "saveSnapshot");
  assert.ok(freshSave.shop40 && freshSave.shop40.ops, "新档应有 shop40.ops");
  pass("新档进主菜单");
  await fresh.close();

  const old = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await old.addInitScript(() => {
    localStorage.setItem("sakurayoV3", JSON.stringify({ coins: 11, tal: { atk: 1 } }));
  });
  const oldPage = await old.newPage();
  await waitMenu(oldPage);
  const oldSave = await api(oldPage, "saveSnapshot");
  assert.equal(oldSave.coins, 11);
  assert.equal(oldSave.tal.atk, 1);
  assert.ok(oldSave.shop40 && oldSave.shop40.ops, "缺字段旧档应补齐 shop40.ops");
  assert.ok(oldSave.character, "缺字段旧档应补齐 character");
  pass("缺字段旧档进主菜单并补齐");
  await old.close();

  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await waitMenu(page);

  await api(page, "openDrawer", "gacha");
  assert.equal(await page.locator("#gachaDrawer").isVisible(), true);
  await page.locator('#gachaTabs46 [data-pool="fashion"]').click();
  assert.match(await page.locator("#gachaDrawer").textContent(), /时装/);
  await page.locator('#gachaTabs46 [data-pool="weapon"]').click();
  assert.match(await page.locator("#gachaDrawer").textContent(), /武器/);
  await page.locator('#gachaTabs46 [data-pool="remnant"]').click();
  assert.match(await page.locator("#gachaDrawer").textContent(), /残片|残件/);
  await page.locator("#gachaDrawer .close").click();
  pass("寻访三页可切换");

  await api(page, "openDrawer", "roster");
  await page.locator('#rosterTabs46 [data-roster="chronicle"]').click();
  assert.equal(await page.locator(".chronicleCard46").count(), 13);
  assert.equal(await page.locator("#rosterWall46 h4").count(), 3);
  assert.match(await page.locator("#rosterDrawer").textContent(), /月城小夜 · 未写完的夜/);
  assert.match(await page.locator("#rosterDrawer").textContent(), /神代绫 · 作废的工号/);
  assert.match(await page.locator("#rosterDrawer").textContent(), /黑羽凛音 · 未署名的刀/);
  assert.equal(await page.locator("#rosterDrawer").textContent().then((t) => t.includes("三角色")), false);
  await page.locator('#rosterTabs46 [data-roster="scrap"]').click();
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 8);
  assert.equal(await page.locator("#rosterDrawer").textContent().then((t) => t.includes("神代绫 · 作废的工号")), false);
  pass("仓库编年三段，点回残件不是空墙");
  await page.locator("#rosterDrawer .close").click();

  await page.locator('[data-open="shop"]').click();
  assert.equal(await page.locator("#shopDrawer").isVisible(), true);
  await page.locator("#shopDrawer .close").click();
  assert.equal(await page.locator("#shopDrawer").isVisible(), false);
  await page.locator('[data-open="stage"]').click();
  assert.match(await page.locator("#modeBar46").textContent(), /回收演习/);
  assert.match(await page.locator("#modeBar46").textContent(), /证词模式/);
  assert.match(await page.locator("#modeBar46").textContent(), /主神空间/);
  await page.locator("#stageDrawer .close").click();
  pass("商店与关卡三模式可开关");

  async function startRun(id) {
    await api(page, "backMenu");
    await api(page, "selectCharacter", id);
    await api(page, "start");
    if (await page.locator("#tutorialDrawer37").isVisible()) {
      await page.locator("#tutorialSkip37").click();
    }
    await api(page, "dismissDialogue");
    await api(page, "protectPlayer");
    await api(page, "freezeProgression");
  }

  for (const id of ["sayo", "aya", "rion"]) {
    await startRun(id);
    await page.evaluate(() => window.advanceTime(10000));
    const snap = await state(page);
    assert.equal(snap.mode, "play");
    assert.equal(snap.player.character, id);
    assert.ok(snap.counts.enemies > 0, `${id} 10 秒内看不见怪`);
    assert.ok(snap.build.attackTotal > 0, `${id} 10 秒内没有攻击`);
    pass(`${id} 10 秒内看见人、怪、攻击`);
  }

  const hudBefore = await page.evaluate(() => {
    const hud = document.querySelector("#hud");
    const box = hud.getBoundingClientRect();
    return { left: box.left, top: box.top, hidden: hud.classList.contains("hidden") };
  });
  assert.equal(hudBefore.hidden, false);
  assert.ok(Math.abs(hudBefore.left) < 2, "HUD 开局应贴视口左边");

  await page.evaluate(() => {
    const canvas = document.querySelector("#game");
    canvas.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 91, pointerType: "touch", clientX: 200, clientY: 720 }));
    canvas.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 91, pointerType: "touch", clientX: 40, clientY: 720 }));
  });
  await page.evaluate(() => window.advanceTime(10000));
  await page.evaluate(() => {
    document.querySelector("#game").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 91, pointerType: "touch", clientX: 40, clientY: 720 }));
  });
  const edge = await state(page);
  assert.equal(edge.mode, "play");
  assert.ok(Math.abs(edge.camera.camX) < 0.01, "走到世界左边镜头必须夹住 camX≈0");
  assert.ok(edge.camera.camX >= -0.01 && edge.camera.camY >= -0.01, "镜头不得露出世界外空白");
  assert.ok(edge.player.x < 120, "角色应贴近世界左缘");
  const screenX = edge.player.x - edge.camera.camX;
  assert.ok(screenX >= 0 && screenX < edge.camera.viewW * 0.45, "左缘时角色应在画面左半，不许半屏空白把人挤到中右");
  const hudAfter = await page.evaluate(() => {
    const hud = document.querySelector("#hud");
    const box = hud.getBoundingClientRect();
    return { left: box.left, top: box.top };
  });
  assert.ok(Math.abs(hudAfter.left) < 2, "镜头平移后 HUD 不得被 translate 拖走");
  const spawned = await api(page, "spawnFromEdge50");
  assert.equal(spawned.inside, false, "怪应从当前视口外刷");
  pass("镜头夹边、HUD 不跟飞、怪从视口外进");

  await page.locator("#dash").click();
  assert.ok((await state(page)).player.dashCooldown > 0);
  await page.locator("#skill").click();
  assert.ok((await state(page)).player.skillCooldown > 0);
  pass("摇杆、冲刺、主动技能");

  const beforeLv = await state(page);
  await api(page, "triggerUpgrade");
  assert.equal((await state(page)).mode, "level");
  assert.equal(await page.locator("#dialogue").evaluate((n) => n.classList.contains("hidden")), true);
  assert.equal(await page.locator("#banter").evaluate((n) => n.classList.contains("hidden")), true);
  await api(page, "chooseUpgrade", 0);
  await page.evaluate(() => window.advanceTime(400));
  const afterLv = await state(page);
  assert.equal(afterLv.mode, "play");
  assert.equal(afterLv.player.level, beforeLv.player.level + 1);
  pass("升级后战斗继续，剧情和吐槽不同时挡");

  await api(page, "spawnBossNow");
  await api(page, "dismissDialogue");
  for (const [ratio, phase] of [[0.75, 2], [0.5, 3], [0.25, 4]]) {
    await api(page, "setBossHpRatio", ratio);
    await page.evaluate(() => window.advanceTime(17));
    const phaseState = await state(page);
    assert.equal(phaseState.boss.phase, phase);
    await api(page, "dismissDialogue");
    assert.equal((await state(page)).mode, "play");
  }
  pass("Boss 75 / 50 / 25");

  await api(page, "killPlayer");
  assert.equal((await state(page)).mode, "result");
  await page.locator("#back").click();
  assert.equal(await page.locator("#menu").isVisible(), true);
  await api(page, "start");
  await api(page, "dismissDialogue");
  assert.equal((await state(page)).mode, "play");
  pass("死亡结算能关，能重新开局");

  console.log(`GATE C PASS ${passed.length} checks`);
  await ctx.close();
  await browser.close();
} catch (error) {
  console.error(error);
  await browser.close();
  process.exit(1);
}

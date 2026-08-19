import assert from "node:assert/strict";
import fs from "node:fs";
import os from "os";
import path from "path";
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
const shotDir = path.join(root, "tests/artifacts/emu");
fs.mkdirSync(shotDir, { recursive: true });
const httpBase = process.env.EMU_BASE || "http://127.0.0.1:8765/src/index.html";
const testUrl = `${httpBase}?test=1&debug=1`;
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const passed = [];
function pass(name) {
  passed.push(name);
  console.log(`PASS ${name}`);
}

async function api(page, method, ...args) {
  return page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
}
async function snap(page) {
  return JSON.parse(await page.evaluate(() => window.render_game_to_text()));
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(shotDir, name), fullPage: true });
}

async function waitMenu(page) {
  await page.goto(testUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".bootArt35").waitFor({ state: "detached", timeout: 8000 });
  assert.equal(await page.locator("#menu").isVisible(), true);
}

async function startRun(page, id) {
  await api(page, "backMenu");
  await api(page, "selectCharacter", id);
  await api(page, "start");
  if (await page.locator("#tutorialDrawer37").isVisible()) await page.locator("#tutorialSkip37").click();
  await api(page, "dismissDialogue");
  await api(page, "protectPlayer");
  await api(page, "freezeProgression");
}

async function holdStick(page, width, height, dx, dy, ms) {
  const jx = Math.round(width * 0.2);
  const jy = Math.round(height * 0.82);
  await page.evaluate(([a, b]) => {
    const c = document.querySelector("#game");
    c.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 11, pointerType: "touch", clientX: a[0], clientY: a[1] }));
    c.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 11, pointerType: "touch", clientX: b[0], clientY: b[1] }));
  }, [[jx, jy], [jx + dx, jy + dy]]);
  await page.evaluate((t) => window.advanceTime(t), ms);
  await page.evaluate(() => {
    document.querySelector("#game").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 11, pointerType: "touch", clientX: 8, clientY: 8 }));
  });
}

async function countBattleBgDraws(page) {
  await page.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype;
    if (!proto.__emuCount) {
      const orig = proto.drawImage;
      proto.__emuN = 0;
      proto.__emuCount = true;
      proto.drawImage = function (img) {
        const src = img && (img.src || img.currentSrc || "");
        if (/battle_bg|void_arena/.test(String(src))) proto.__emuN += 1;
        return orig.apply(this, arguments);
      };
    }
    proto.__emuN = 0;
  });
  await page.evaluate(() => window.advanceTime(17));
  return page.evaluate(() => CanvasRenderingContext2D.prototype.__emuN || 0);
}

async function runViewport(width, height, tag) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width <= 500, hasTouch: true });
  const page = await ctx.newPage();
  await waitMenu(page);
  await shot(page, `${tag}-menu.png`);
  const save = await api(page, "saveSnapshot");
  assert.ok(save.shop40 && save.shop40.ops, `${tag} 新档应补齐 shop40.ops`);
  pass(`${tag} 新档进主菜单`);

  await api(page, "openDrawer", "gacha");
  assert.equal(await page.locator("#gachaDrawer").isVisible(), true);
  await page.locator('#gachaTabs46 [data-pool="fashion"]').click();
  await page.locator('#gachaTabs46 [data-pool="weapon"]').click();
  await page.locator('#gachaTabs46 [data-pool="remnant"]').click();
  await shot(page, `${tag}-gacha.png`);
  await page.locator("#gachaDrawer .close").click();
  await api(page, "openDrawer", "roster");
  await page.locator('#rosterTabs46 [data-roster="chronicle"]').click();
  const text = await page.locator("#rosterDrawer").textContent();
  assert.match(text, /月城小夜 · 未写完的夜/);
  assert.match(text, /神代绫 · 作废的工号/);
  assert.match(text, /黑羽凛音 · 未署名的刀/);
  assert.equal(text.includes("三角色"), false);
  assert.equal(await page.locator(".chronicleCard46").count(), 13);
  await page.locator('#rosterTabs46 [data-roster="scrap"]').click();
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 8);
  await shot(page, `${tag}-roster.png`);
  await page.locator("#rosterDrawer .close").click();
  await page.locator('[data-open="shop"]').click();
  assert.equal(await page.locator("#shopDrawer").isVisible(), true);
  await page.locator("#shopDrawer .close").click();
  await page.locator('[data-open="stage"]').click();
  assert.match(await page.locator("#modeBar46").textContent(), /回收演习|证词模式|主神空间/);
  await page.locator("#stageDrawer .close").click();
  pass(`${tag} 寻访三页/编年回残件/商店关卡可开关`);

  for (const id of ["sayo", "aya", "rion"]) {
    await startRun(page, id);
    await page.evaluate(() => window.advanceTime(10000));
    const s = await snap(page);
    assert.equal(s.mode, "play", `${tag} ${id} mode`);
    assert.ok(s.counts.enemies > 0, `${tag} ${id} 10秒看不见怪`);
    assert.ok(s.build.attackTotal > 0, `${tag} ${id} 10秒没有攻击`);
    pass(`${tag} ${id} 10秒内有人怪攻击`);
  }

  await shot(page, `${tag}-combat.png`);
  const hintPlay = await page.evaluate(() => {
    const hint = document.querySelector("#rotateHint46");
    if (!hint) return { shown: false, display: "none" };
    const s = getComputedStyle(hint);
    const box = hint.getBoundingClientRect();
    return { shown: s.display !== "none" && box.height > 0, display: s.display, height: box.height };
  });
  assert.equal(hintPlay.display, "none", `${tag} 战斗中横持提示必须 display:none，实际 ${hintPlay.display}`);
  assert.equal(hintPlay.shown, false, `${tag} 战斗中横持提示不得挡住 HUD`);
  pass(`${tag} 战斗中无横持提示`);

  const before = await snap(page);
  await holdStick(page, width, height, -140, 0, 12000);
  const edge = await snap(page);
  assert.ok(edge.camera.camX >= -0.01, `${tag} camX 不许负值`);
  assert.ok(Math.abs(edge.camera.camX) < 0.05, `${tag} 走到左缘 camX 必须≈0，实际 ${edge.camera.camX}`);
  assert.ok(edge.player.x < 160, `${tag} 角色应贴世界左缘`);
  await shot(page, `${tag}-left-edge.png`);
  const bgDraws = await countBattleBgDraws(page);
  assert.ok(bgDraws <= 1, `${tag} 4×2 每帧战场图只许铺 1 次，实际 ${bgDraws}`);
  pass(`${tag} 镜头夹边且战场图不按格重铺`);

  const spawned = await api(page, "spawnFromEdge50");
  assert.equal(spawned.inside, false, `${tag} 怪应从视口外刷`);
  await page.locator("#dash").click({ force: true });
  await page.locator("#skill").click({ force: true });
  const acts = await snap(page);
  assert.ok(acts.player.dashCooldown > 0 || before.player.x !== acts.player.x, `${tag} 冲刺`);
  pass(`${tag} 触控移动/冲刺/技能`);

  await api(page, "triggerUpgrade");
  if ((await snap(page)).mode === "level") {
    assert.equal(await page.locator("#dialogue").evaluate((n) => n.classList.contains("hidden")), true);
    assert.equal(await page.locator("#banter").evaluate((n) => n.classList.contains("hidden")), true);
    await api(page, "chooseUpgrade", 0);
    await page.evaluate(() => window.advanceTime(300));
    assert.equal((await snap(page)).mode, "play");
  }
  pass(`${tag} 升级后继续`);

  await api(page, "spawnBossNow");
  await api(page, "dismissDialogue");
  for (const [ratio, phase] of [[0.75, 2], [0.5, 3], [0.25, 4]]) {
    await api(page, "setBossHpRatio", ratio);
    await page.evaluate(() => window.advanceTime(17));
    assert.equal((await snap(page)).boss.phase, phase, `${tag} boss ${ratio}`);
    await api(page, "dismissDialogue");
  }
  pass(`${tag} Boss 75/50/25`);

  await api(page, "killPlayer");
  assert.equal((await snap(page)).mode, "result");
  await page.locator("#back").click();
  assert.equal(await page.locator("#menu").isVisible(), true);
  pass(`${tag} 结算能关能重开`);
  await ctx.close();
}

try {
  const old = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  await old.addInitScript(() => localStorage.setItem("sakurayoV3", JSON.stringify({ coins: 11, tal: { atk: 1 } })));
  const oldPage = await old.newPage();
  await waitMenu(oldPage);
  const oldSave = await api(oldPage, "saveSnapshot");
  assert.equal(oldSave.coins, 11);
  assert.ok(oldSave.shop40 && oldSave.shop40.ops, "缺字段旧档应补齐 shop40.ops");
  pass("缺字段旧档进主菜单");
  await old.close();

  await runViewport(430, 932, "p430");
  await runViewport(932, 430, "l932");
  console.log(`EMU LOOP PASS ${passed.length} checks`);
  await browser.close();
} catch (error) {
  console.error("EMU LOOP FAIL");
  console.error(error);
  await browser.close();
  process.exit(1);
}

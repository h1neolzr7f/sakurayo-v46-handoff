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
const findings = [];

function boxOverlap(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (w <= 1 || h <= 1) return 0;
  return w * h;
}

async function api(page, method, ...args) {
  return page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
}

async function waitMenu(page) {
  await page.goto(testUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".bootArt35").waitFor({ state: "detached", timeout: 8000 });
  assert.equal(await page.locator("#menu").isVisible(), true);
}

async function layoutBoxes(page, selectors) {
  return page.evaluate((sels) => {
    const out = {};
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) {
        out[sel] = null;
        continue;
      }
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out[sel] = {
        display: s.display,
        vis: s.visibility,
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        text: (el.innerText || "").slice(0, 40),
      };
    }
    return out;
  }, selectors);
}

async function hitCenter(page, sel) {
  return page.evaluate((selector) => {
    const btn = document.querySelector(selector);
    if (!btn) return { ok: false, reason: "missing" };
    const box = btn.getBoundingClientRect();
    const el = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return {
      ok: !!(el && (el === btn || btn.contains(el))),
      hit: el ? (el.id || el.className || el.tagName) : null,
    };
  }, sel);
}

async function scanViewport(width, height, tag) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width <= 500, hasTouch: true });
  const page = await ctx.newPage();
  await waitMenu(page);
  await page.screenshot({ path: path.join(shotDir, `${tag}-scan-menu.png`), fullPage: true });

  const navGacha = await hitCenter(page, '#menu .homeNav46 [data-open="gacha"], #menu .nav [data-open="gacha"]');
  const navRoster = await hitCenter(page, '#menu .homeNav46 [data-open="roster"], #menu .nav [data-open="roster"]');
  if (!navGacha.ok) findings.push({ sev: "P1", tag, msg: `大厅寻访键 elementFromPoint 未命中，hit=${navGacha.hit}` });
  if (!navRoster.ok) findings.push({ sev: "P1", tag, msg: `大厅仓库键 elementFromPoint 未命中，hit=${navRoster.hit}` });

  await api(page, "openDrawer", "gacha");
  assert.equal(await page.locator("#gachaDrawer").isVisible(), true);
  const tabSels = ['#gachaTabs46 [data-pool="remnant"]', '#gachaTabs46 [data-pool="fashion"]', '#gachaTabs46 [data-pool="weapon"]'];
  const gachaBoxes = await layoutBoxes(page, [...tabSels, ".wishTitle46", ".wishTitle46 h3", ".wishTitle46 p", "#gachaDrawer .close", ".pityRow46 span", ".pityRail46"]);
  console.log(`${tag} GACHA_BOXES`, JSON.stringify(gachaBoxes));
  for (let i = 0; i < tabSels.length; i++) {
    for (let j = i + 1; j < tabSels.length; j++) {
      const a = gachaBoxes[tabSels[i]];
      const b = gachaBoxes[tabSels[j]];
      if (a && b && boxOverlap(a, b) > 8) {
        findings.push({ sev: "P1", tag, msg: `寻访页签叠字 ${tabSels[i]} ∩ ${tabSels[j]} area=${boxOverlap(a, b)}` });
      }
    }
    const hit = await hitCenter(page, tabSels[i]);
    if (!hit.ok) findings.push({ sev: "P1", tag, msg: `寻访页签点不中 ${tabSels[i]} hit=${hit.hit}` });
  }
  const title = gachaBoxes[".wishTitle46 h3"];
  for (const sel of tabSels) {
    const tab = gachaBoxes[sel];
    if (title && tab && boxOverlap(title, tab) > 20) {
      findings.push({ sev: "P1", tag, msg: `寻访标题与页签叠字 ${sel} area=${boxOverlap(title, tab)}` });
    }
  }
  await page.locator('#gachaTabs46 [data-pool="fashion"]').click();
  await page.locator('#gachaTabs46 [data-pool="weapon"]').click();
  await page.locator('#gachaTabs46 [data-pool="remnant"]').click();
  await page.screenshot({ path: path.join(shotDir, `${tag}-scan-gacha.png`), fullPage: true });
  await page.locator("#gachaDrawer .close").click();

  await api(page, "openDrawer", "roster");
  await page.locator('#rosterTabs46 [data-roster="chronicle"]').click();
  assert.equal(await page.locator(".chronicleCard46").count(), 13);
  const firstCard = page.locator(".chronicleCard46").first();
  await firstCard.click({ force: true });
  await page.locator('#rosterTabs46 [data-roster="scrap"]').click();
  const scrapCount = await page.locator("#rosterWall46 .rosterSlot46").count();
  const wallText = await page.locator("#rosterWall46").textContent();
  const wallBox = await page.locator("#rosterWall46").boundingBox();
  console.log(`${tag} SCRAP_AFTER_CHRONICLE`, { scrapCount, wallH: wallBox && wallBox.height, wallText: (wallText || "").slice(0, 80) });
  if (scrapCount !== 8) findings.push({ sev: "P1", tag, msg: `编年点回残件墙格数=${scrapCount}，应为 8` });
  if (!wallBox || wallBox.height < 40) findings.push({ sev: "P1", tag, msg: `编年点回残件空墙 height=${wallBox && wallBox.height}` });
  if ((wallText || "").includes("后续写入") && scrapCount === 0) {
    findings.push({ sev: "P1", tag, msg: "编年点回残件变成后续写入空墙" });
  }

  const rosterTabSels = ["scrap", "school", "job", "fusion", "fashion", "weapon", "chronicle"].map((id) => `#rosterTabs46 [data-roster="${id}"]`);
  const rosterBoxes = await layoutBoxes(page, rosterTabSels);
  for (let i = 0; i < rosterTabSels.length; i++) {
    for (let j = i + 1; j < rosterTabSels.length; j++) {
      const a = rosterBoxes[rosterTabSels[i]];
      const b = rosterBoxes[rosterTabSels[j]];
      if (a && b && boxOverlap(a, b) > 8) {
        findings.push({ sev: "P1", tag, msg: `仓库页签叠字 ${rosterTabSels[i]} ∩ ${rosterTabSels[j]}` });
      }
    }
  }
  await page.screenshot({ path: path.join(shotDir, `${tag}-scan-roster.png`), fullPage: true });
  await page.locator("#rosterDrawer .close").click();

  const gachaStill = await page.locator("#gachaDrawer").isVisible();
  const rosterStill = await page.locator("#rosterDrawer").isVisible();
  if (gachaStill && rosterStill) findings.push({ sev: "P1", tag, msg: "寻访和仓库抽屉同时可见" });

  await api(page, "backMenu");
  await api(page, "selectCharacter", "sayo");
  await api(page, "start");
  if (await page.locator("#tutorialDrawer37").isVisible()) await page.locator("#tutorialSkip37").click();
  await api(page, "dismissDialogue");
  await api(page, "protectPlayer");
  await api(page, "freezeProgression");
  await page.evaluate(() => window.advanceTime(2000));

  const hud = await page.evaluate(() => {
    const hint = document.querySelector("#rotateHint46");
    const hs = hint ? getComputedStyle(hint) : null;
    const hb = hint ? hint.getBoundingClientRect() : null;
    const hudEl = document.querySelector("#hud");
    const hudBox = hudEl ? hudEl.getBoundingClientRect() : null;
    const playing = document.documentElement.classList.contains("playing46");
    return {
      playing,
      hintDisplay: hs && hs.display,
      hint: hb && { x: hb.x, y: hb.y, w: hb.width, h: hb.height },
      hud: hudBox && { x: hudBox.x, y: hudBox.y, w: hudBox.width, h: hudBox.height },
    };
  });
  console.log(`${tag} HUD_HINT`, JSON.stringify(hud));
  if (hud.hintDisplay !== "none") findings.push({ sev: "P1", tag, msg: `战斗中横持提示 display=${hud.hintDisplay}` });
  if (hud.hint && hud.hud && hud.hintDisplay !== "none" && boxOverlap(hud.hint, hud.hud) > 0) {
    findings.push({ sev: "P1", tag, msg: "横持提示压住 HUD" });
  }
  const dashHit = await hitCenter(page, "#dash");
  const skillHit = await hitCenter(page, "#skill");
  if (!dashHit.ok) findings.push({ sev: "P1", tag, msg: `冲刺键点不中 hit=${dashHit.hit}` });
  if (!skillHit.ok) findings.push({ sev: "P1", tag, msg: `技能键点不中 hit=${skillHit.hit}` });

  const jx = Math.round(width * 0.2);
  const jy = Math.round(height * 0.82);
  await page.evaluate(([a, b]) => {
    const c = document.querySelector("#game");
    c.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 11, pointerType: "touch", clientX: a[0], clientY: a[1] }));
    c.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 11, pointerType: "touch", clientX: b[0], clientY: b[1] }));
  }, [[jx, jy], [jx - 140, jy]]);
  let edge = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  for (let i = 0; i < 8 && edge.player.x >= 160; i++) {
    await page.evaluate((t) => window.advanceTime(t), 4000);
    edge = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  }
  await page.evaluate(() => {
    document.querySelector("#game").dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 11, pointerType: "touch", clientX: 8, clientY: 8 }));
  });
  console.log(`${tag} CAM_LEFT`, { camX: edge.camera.camX, playerX: edge.player.x });
  if (edge.player.x < 160) {
    if (edge.camera.camX < -0.01) findings.push({ sev: "P1", tag, msg: `夹到世界左边 camX=${edge.camera.camX} 负值半屏` });
    if (Math.abs(edge.camera.camX) > 0.05) findings.push({ sev: "P1", tag, msg: `走到左缘 camX=${edge.camera.camX} 必须≈0` });
  } else {
    console.log(`${tag} CAM_LEFT_SKIP player still x=${edge.player.x}`);
  }

  await page.screenshot({ path: path.join(shotDir, `${tag}-scan-combat.png`), fullPage: true });
  await ctx.close();
}

try {
  const src = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
  if (/update\s*=\s*function\s*\(\s*dt\s*\)\s*\{\s*return\s+fixedUpdate/.test(src)) {
    findings.push({ sev: "P1", msg: "update 又包了一层 fixedUpdate" });
  }
  const bulletBlock = src.match(/for \(const b of bullets\) \{[\s\S]{0,1200}/);
  if (bulletBlock && /for \(const e of enemies\)/.test(bulletBlock[0])) {
    findings.push({ sev: "P1", msg: "子弹循环里又扫全部 enemies" });
  }
  if (!/for \(const e of grid\.near\(b\.x, b\.y, 50\)\)/.test(src)) {
    findings.push({ sev: "P1", msg: "子弹碰撞不再走 grid.near" });
  }

  await scanViewport(430, 932, "p430");
  await scanViewport(932, 430, "l932");
  await scanViewport(2400, 1080, "l2400");

  const p0 = findings.filter((f) => f.sev === "P0");
  const p1 = findings.filter((f) => f.sev === "P1");
  console.log("SCAN_FINDINGS", JSON.stringify(findings, null, 2));
  console.log(`EMU SCAN P0=${p0.length} P1=${p1.length}`);
  await browser.close();
  if (p0.length || p1.length) process.exit(1);
  console.log("EMU SCAN PASS");
} catch (error) {
  console.error("EMU SCAN FAIL");
  console.error(error);
  await browser.close();
  process.exit(1);
}

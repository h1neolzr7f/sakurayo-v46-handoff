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
  const talking = await page.evaluate(() => {
    const dlg = document.querySelector("#dialogue");
    const dock = document.querySelector("#opsDock46");
    return {
      open: !!(dlg && !dlg.classList.contains("hidden")),
      dockOn: !!(dock && !dock.hidden),
    };
  });
  if (talking.open) assert.equal(talking.dockOn, false, "剧情模态时干员坞必须收起");
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
  const classes = await page.evaluate(() => ({
    landscape: document.documentElement.classList.contains("landscape46"),
    portrait: document.documentElement.classList.contains("portraitFallback46"),
    tall: document.documentElement.classList.contains("tallWindow46"),
    hint: !!document.querySelector("#rotateHint46"),
  }));
  assert.equal(classes.landscape, true, `${tag} 必须走横屏 class`);
  assert.equal(classes.portrait, false, `${tag} 禁止 portraitFallback46`);
  assert.equal(classes.tall, false, `${tag} 禁止 tallWindow46`);
  assert.equal(classes.hint, false, `${tag} 禁止创建横持提示`);
  const heroTop = await page.evaluate(() => getComputedStyle(document.querySelector(".heroLive46") || document.body).top);
  assert.equal(heroTop, "0px", `${tag} 立绘容器 top 必须是 0，实际 ${heroTop}`);
  const save = await api(page, "saveSnapshot");
  assert.ok(save.shop40 && save.shop40.ops, `${tag} 新档应补齐 shop40.ops`);
  pass(`${tag} 新档进主菜单`);

  await api(page, "openDrawer", "gacha");
  assert.equal(await page.locator("#gachaDrawer").isVisible(), true);
  await page.locator('#gachaTabs46 [data-pool="fashion"]').click();
  await page.locator('#gachaTabs46 [data-pool="weapon"]').click();
  await page.locator('#gachaTabs46 [data-pool="remnant"]').click();
  const gachaHit = await page.evaluate(() => {
    function box(el) {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }
    function overlap(a, b) {
      const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      return w > 1 && h > 1 ? w * h : 0;
    }
    const tabs = [...document.querySelectorAll("#gachaTabs46 [data-pool]")];
    const title = document.querySelector(".wishTitle46 h3");
    const pity = document.querySelector(".wishPity46");
    const dock = document.querySelector(".wishDock46");
    const hits = tabs.map((btn) => {
      const r = btn.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!(el && (el === btn || btn.contains(el)));
    });
    let tabOverlap = 0;
    let titleOverlap = 0;
    for (let i = 0; i < tabs.length; i++) {
      for (let j = i + 1; j < tabs.length; j++) tabOverlap = Math.max(tabOverlap, overlap(box(tabs[i]), box(tabs[j])));
      if (title) titleOverlap = Math.max(titleOverlap, overlap(box(title), box(tabs[i])));
    }
    const pityDock = pity && dock ? overlap(box(pity), box(dock)) : 0;
    return { hits, tabOverlap, titleOverlap, pityDock };
  });
  assert.deepEqual(gachaHit.hits, [true, true, true], `${tag} 寻访三页必须点得中`);
  assert.ok(gachaHit.tabOverlap <= 8, `${tag} 寻访页签叠字 area=${gachaHit.tabOverlap}`);
  assert.ok(gachaHit.titleOverlap <= 20, `${tag} 寻访标题叠页签 area=${gachaHit.titleOverlap}`);
  assert.ok(gachaHit.pityDock <= 8, `${tag} 寻访保底条叠抽卡坞 area=${gachaHit.pityDock}`);
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
  await page.locator(".chronicleCard46").first().click({ force: true });
  await page.locator('#rosterTabs46 [data-roster="scrap"]').click();
  assert.equal(await page.locator("#rosterWall46 .rosterSlot46").count(), 8);
  const wallBox = await page.locator("#rosterWall46").boundingBox();
  assert.ok(wallBox && wallBox.height >= 40, `${tag} 编年点回残件不能空墙`);
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
    if (id === "sayo") {
      await page.evaluate(() => window.advanceTime(400));
      const hintDup = await page.evaluate(() => {
        const toast = document.querySelector("#toast");
        const mission = document.querySelector("#mission");
        const t = toast && toast.classList.contains("show") ? String(toast.textContent || "").trim() : "";
        const m = String(mission?.textContent || "").trim();
        return { t, same: !!(t && m && m.includes(t)) };
      });
      assert.equal(hintDup.same, false, `${tag} 开局 toast 不得复述 mission：${hintDup.t}`);
    }
    await page.evaluate((ms) => window.advanceTime(ms), id === "sayo" ? 9600 : 10000);
    const s = await snap(page);
    assert.equal(s.mode, "play", `${tag} ${id} mode`);
    assert.ok(s.counts.enemies > 0, `${tag} ${id} 10秒看不见怪`);
    assert.ok(s.build.attackTotal > 0, `${tag} ${id} 10秒没有攻击`);
    pass(`${tag} ${id} 10秒内有人怪攻击`);
  }

  await shot(page, `${tag}-combat.png`);
  assert.equal(await page.evaluate(() => !!document.querySelector("#rotateHint46")), false, `${tag} 战斗中不得再出现横持提示`);
  pass(`${tag} 战斗中无横持提示`);

  const stickGuard = await page.evaluate(([w, h]) => {
    const x = Math.round(w * 0.2);
    const y = Math.round(h * 0.82);
    const el = document.elementFromPoint(x, y);
    const dock = document.querySelector("#opsDock46");
    const joy = document.querySelector("#joy");
    const box = (n) => {
      if (!n) return null;
      const r = n.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const a = box(dock);
    const b = box(joy);
    let overlap = 0;
    if (a && b && !dock.hidden) {
      const ww = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const hh = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      overlap = ww > 1 && hh > 1 ? ww * hh : 0;
    }
    return {
      onDock: !!(dock && !dock.hidden && el && dock.contains(el)),
      overlap,
      units: window.SakurayoOps ? window.SakurayoOps.snapshot().units.length : 0,
    };
  }, [width, height]);
  assert.equal(stickGuard.onDock, false, `${tag} 默认摇杆点不得落在干员坞上`);
  assert.equal(stickGuard.overlap, 0, `${tag} 干员坞不得压住 #joy，重叠 ${stickGuard.overlap}`);
  await page.mouse.click(Math.round(width * 0.2), Math.round(height * 0.82));
  const unitsAfter = await page.evaluate(() => window.SakurayoOps ? window.SakurayoOps.snapshot().units.length : 0);
  assert.equal(unitsAfter, stickGuard.units, `${tag} 默认摇杆点短触不得误部署干员`);
  pass(`${tag} 摇杆点不误部署干员`);

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
    assert.equal(await page.locator("#warning").evaluate((n) => n.classList.contains("hidden")), true, `${tag} 升级时 warning 必须收起`);
    await api(page, "chooseUpgrade", 0);
    await page.evaluate(() => window.advanceTime(300));
    assert.equal((await snap(page)).mode, "play");
  }
  pass(`${tag} 升级后继续`);

  await api(page, "spawnBossNow");
  await api(page, "dismissDialogue");
  await page.evaluate(() => window.advanceTime(50));
  const ruleOverlap = await page.evaluate(() => {
    const a = document.querySelector("#bossRule39");
    const b = document.querySelector("#mission");
    if (!a || !b || a.classList.contains("hidden")) return 0;
    const r = a.getBoundingClientRect();
    const m = b.getBoundingClientRect();
    const w = Math.min(r.right, m.right) - Math.max(r.left, m.left);
    const h = Math.min(r.bottom, m.bottom) - Math.max(r.top, m.top);
    return w > 1 && h > 1 ? w * h : 0;
  });
  assert.ok(ruleOverlap <= 8, `${tag} Boss 规则条不得压 mission，重叠 ${ruleOverlap}`);
  await api(page, "triggerUpgrade");
  if ((await snap(page)).mode === "level") {
    assert.equal(await page.locator("#warning").evaluate((n) => n.classList.contains("hidden")), true, `${tag} Boss 警告不得压在升级卡上`);
    await api(page, "chooseUpgrade", 0);
    await page.evaluate(() => window.advanceTime(300));
  }
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

  const resultCtx = await browser.newContext({ viewport: { width: 932, height: 430 }, hasTouch: true });
  const resultPage = await resultCtx.newPage();
  await waitMenu(resultPage);
  await startRun(resultPage, "sayo");
  await api(resultPage, "seedProgression45", { form: "corrupt_form_id" });
  await api(resultPage, "finish", true);
  const resultUi = await resultPage.evaluate(() => ({
    mode: JSON.parse(window.render_game_to_text()).mode,
    resultVisible: !document.querySelector("#result").classList.contains("hidden"),
    menuVisible: !document.querySelector("#menu").classList.contains("hidden"),
    rstats: document.querySelector("#rstats")?.textContent || "",
  }));
  assert.equal(resultUi.mode, "result");
  assert.equal(resultUi.resultVisible, true, "无效飞升 ID 时结算层必须出现");
  assert.equal(resultUi.menuVisible, false, "结算软锁不得只剩 canvas");
  assert.match(resultUi.rstats, /飞升/);
  await resultPage.locator("#back").click();
  assert.equal(await resultPage.locator("#menu").isVisible(), true);
  pass("无效飞升仍弹出结算");
  await resultCtx.close();

  const toastCtx = await browser.newContext({ viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true });
  const toastPage = await toastCtx.newPage();
  await waitMenu(toastPage);
  await api(toastPage, "setRunMode46", "testimony");
  await startRun(toastPage, "sayo");
  await api(toastPage, "triggerUpgrade");
  await toastPage.evaluate(() => window.advanceTime(250));
  const toastOverlap = await toastPage.evaluate(() => {
    const a = document.querySelector("#toast");
    const b = document.querySelector("#mission");
    if (!a || !b || !a.classList.contains("show")) return { overlap: 0, shown: false };
    const r = a.getBoundingClientRect();
    const m = b.getBoundingClientRect();
    const w = Math.min(r.right, m.right) - Math.max(r.left, m.left);
    const h = Math.min(r.bottom, m.bottom) - Math.max(r.top, m.top);
    return { overlap: w > 1 && h > 1 ? w * h : 0, shown: true, toast: a.textContent || "" };
  });
  assert.equal(toastOverlap.shown, true, "证词升级应弹出 toast");
  assert.ok(toastOverlap.overlap <= 8, `证词 toast 不得压 mission，重叠 ${toastOverlap.overlap}`);
  pass("证词升级 toast 不压 mission");
  await toastCtx.close();

  const modeCtx = await browser.newContext({ viewport: { width: 932, height: 430 }, hasTouch: true });
  const modePage = await modeCtx.newPage();
  await waitMenu(modePage);
  await api(modePage, "openDrawer", "stage");
  await modePage.locator('#modeBar46 [data-mode="testimony"]').click();
  await modePage.locator("#stageDrawer .close").click();
  await modePage.locator("#start").click();
  if (await modePage.locator("#tutorialDrawer37").isVisible()) await modePage.locator("#tutorialSkip37").click();
  await api(modePage, "dismissDialogue");
  await api(modePage, "protectPlayer");
  await api(modePage, "freezeProgression");
  await api(modePage, "triggerUpgrade");
  const testimonyUi = await modePage.evaluate(() => ({
    levelOpen: !document.querySelector("#level").classList.contains("hidden"),
    toast: document.querySelector("#toast")?.textContent || "",
    hud: document.querySelector("#stageHud")?.textContent || "",
  }));
  assert.equal(testimonyUi.levelOpen, false, "关卡胶囊选证词后出击不得再弹升级卡");
  assert.match(testimonyUi.toast + testimonyUi.hud, /证词/);
  await api(modePage, "backMenu");
  await api(modePage, "openDrawer", "stage");
  await modePage.locator('#modeBar46 [data-mode="mainGod"]').click();
  await modePage.locator("#stageDrawer .close").click();
  await modePage.locator("#start").click();
  const mainGodUi = await modePage.evaluate(() => ({
    menu: !document.querySelector("#menu").classList.contains("hidden"),
    stageOpen: !document.querySelector("#stageDrawer").classList.contains("hidden"),
    playing: JSON.parse(window.render_game_to_text()).mode,
  }));
  assert.equal(mainGodUi.menu, true, "主神胶囊未点进入轮回时出击必须留在大厅");
  assert.equal(mainGodUi.stageOpen, true, "主神胶囊出击应打开关卡页让玩家点进入轮回");
  assert.notEqual(mainGodUi.playing, "play");
  pass("关卡胶囊出击写入正确模式");
  await modeCtx.close();

  const lobbyToastCtx = await browser.newContext({ viewport: { width: 932, height: 430 }, hasTouch: true });
  const lobbyToastPage = await lobbyToastCtx.newPage();
  await waitMenu(lobbyToastPage);
  await lobbyToastPage.locator('.charCard[data-character="aya"]').click();
  await lobbyToastPage.waitForFunction(() => {
    const t = document.querySelector("#toast");
    return !!(t && t.classList.contains("show") && /出击角色/.test(t.textContent || ""));
  }, null, { timeout: 2000 });
  pass("大厅换角 toast 可见");
  await startRun(lobbyToastPage, "sayo");
  await api(lobbyToastPage, "triggerUpgrade");
  if ((await snap(lobbyToastPage)).mode === "level") {
    await api(lobbyToastPage, "chooseUpgrade", 0);
    await lobbyToastPage.evaluate(() => window.advanceTime(400));
  }
  const leaked = await lobbyToastPage.evaluate(() => {
    const t = document.querySelector("#toast");
    return !!(t && t.classList.contains("show") && /出击角色/.test(t.textContent || ""));
  });
  assert.equal(leaked, false, "大厅 toast 不得漏进战斗");
  pass("大厅 toast 不漏进战斗");
  await lobbyToastCtx.close();

  const mainGodPillCtx = await browser.newContext({ viewport: { width: 932, height: 430 }, hasTouch: true });
  const mainGodPillPage = await mainGodPillCtx.newPage();
  await waitMenu(mainGodPillPage);
  await api(mainGodPillPage, "openDrawer", "stage");
  await mainGodPillPage.locator('#modeBar46 [data-mode="mainGod"]').click();
  await mainGodPillPage.locator('.stageCard[data-stage-id="1"] button:not(.exploreEntry41)').click();
  const pillGuard = await mainGodPillPage.evaluate(() => ({
    drawer: !document.querySelector("#stageDrawer").classList.contains("hidden"),
    toast: document.querySelector("#toast")?.textContent || "",
    modeOn: document.querySelector('#modeBar46 [data-mode="mainGod"]')?.classList.contains("on") || false,
  }));
  assert.equal(pillGuard.drawer, true, "主神胶囊下点章节不得关抽屉改成 story");
  assert.equal(pillGuard.modeOn, true, "主神胶囊必须保持选中");
  assert.equal(/已选择/.test(pillGuard.toast), false, "主神胶囊下点章节不得写成已选择普通关");
  pass("主神胶囊下点章节不改回 story");
  await mainGodPillCtx.close();

  await runViewport(430, 932, "p430");
  await runViewport(932, 430, "l932");
  const thin = await browser.newContext({ viewport: { width: 600, height: 400 }, hasTouch: true });
  const thinPage = await thin.newPage();
  await waitMenu(thinPage);
  const thinCls = await thinPage.evaluate(() => ({
    portrait: document.documentElement.classList.contains("portraitFallback46"),
    hint: !!document.querySelector("#rotateHint46"),
    landscape: document.documentElement.classList.contains("landscape46"),
  }));
  assert.equal(thinCls.landscape, true);
  assert.equal(thinCls.portrait, false, "600×400 窄横屏不得走竖版回退");
  assert.equal(thinCls.hint, false, "600×400 不得出现横持提示");
  pass("窄横屏仍走横版不分竖屏回退");
  await thin.close();
  console.log(`EMU LOOP PASS ${passed.length} checks`);
  await browser.close();
} catch (error) {
  console.error("EMU LOOP FAIL");
  console.error(error);
  await browser.close();
  process.exit(1);
}

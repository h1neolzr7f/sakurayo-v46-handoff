import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const sourceArg = process.argv[2] || "src/index.html";
const source = /^https?:\/\//i.test(sourceArg) ? sourceArg : path.resolve(root, sourceArg);
const baseUrl = /^https?:\/\//i.test(source) ? source : pathToFileURL(source).href;
const url = `${baseUrl}?test=1&debug=1`;
const artifactDir = path.join(root, "tests/artifacts/landscape");
fs.mkdirSync(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 932, height: 430 },
  isMobile: true,
  hasTouch: true,
});
await context.addInitScript(() => {
  localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true }));
  let seed = 0x46c1a0;
  Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
});

const pageErrors = [];
const consoleErrors = [];
const externalRequests = [];
const screenshots = [];
const page = await context.newPage();
page.on("pageerror", error => pageErrors.push(String(error)));
page.on("console", message => {
  if (message.type() !== "error") return;
  const text = `${message.text()} ${message.location()?.url || ""}`;
  if (!/(?:career_|form_|fusion_)[A-Za-z]+\/anim_|fusions\/[A-Za-z]+\/splash/.test(text)) {
    consoleErrors.push(message.text());
  }
});
page.on("request", request => {
  if (!/^https?:/i.test(request.url())) return;
  if (!/^https?:/i.test(baseUrl) || new URL(request.url()).origin !== new URL(baseUrl).origin) {
    externalRequests.push(request.url());
  }
});

async function api(method, ...args) {
  return page.evaluate(
    ({ method, args }) => window.__SAKURAYO_TEST__[method](...args),
    { method, args },
  );
}

async function snapshot() {
  return JSON.parse(await page.evaluate(() => window.render_game_to_text()));
}

async function shot(name) {
  await page.waitForTimeout(380);
  const output = path.join(artifactDir, name);
  await page.screenshot({ path: output });
  screenshots.push(path.relative(root, output));
}

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator(".bootArt35").waitFor({ state: "detached", timeout: 5000 });
  await api("preloadCombatArt412");
  await page.waitForFunction(
    () => window.__SAKURAYO_COMBAT_ART__?.status().every(item => item.ready),
    null,
    { timeout: 20000 },
  );

  await api("start");
  const briefing = await api("cutscene44");
  // ?test=1 skips briefing animation so start() is not stuck on storyBeat44.
  if (briefing && briefing.playing) {
    assert.equal(briefing.sequence, "briefing");
    assert.match(await page.locator("#storyBeat44").innerText(), /OPERATION ORDER|神社外街/);
    await shot("00-landscape-operation-briefing.png");
  } else {
    const afterStart = await snapshot();
    assert.ok(afterStart.mode === "dialogue" || afterStart.mode === "play", afterStart.mode);
    await shot("00-landscape-operation-briefing.png");
  }
  if ((await snapshot()).mode === "dialogue") await api("dismissDialogue");
  await api("protectPlayer");
  await api("freezeProgression");
  await api("spawnEnemyNear", "normal", 110);
  await page.evaluate(() => window.advanceTime(1800));

  const combat = await snapshot();
  const canvas = await page.locator("#cv, #game, canvas").first().boundingBox();
  assert.equal(combat.mode, "play");
  assert.ok(combat.counts.enemies > 0);
  assert.ok(canvas && canvas.width >= 900 && canvas.height >= 400, "横屏画布没有铺满 932×430");
  assert.equal(await page.locator("#hud").isVisible(), true);
  assert.equal(await page.locator("#skill").isVisible(), true);
  assert.equal(await page.locator("#dash").isVisible(), true);
  const hudBoxes = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return null;
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const hit = (a, b) => {
      if (!a || !b) return 0;
      const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      return x * y;
    };
    const hero = box(document.querySelector("#hud .hero"));
    const ops = box(document.getElementById("opsDock46"));
    const wave = box(document.querySelector("#hud .wave"));
    const mission = box(document.getElementById("mission"));
    const pause = box(document.getElementById("pause"));
    return { opsWave: hit(ops, wave), opsMission: hit(ops, mission), heroOps: hit(hero, ops), pauseWave: hit(pause, wave) };
  });
  assert.equal(hudBoxes.opsWave, 0, "干员坞不得盖住波次条");
  assert.equal(hudBoxes.opsMission, 0, "干员坞不得盖住任务条");
  assert.equal(hudBoxes.heroOps, 0, "血条不得盖住干员坞");
  assert.equal(hudBoxes.pauseWave, 0, "暂停不得盖住波次条");
  await shot("01-landscape-combat.png");

  await api("spawnBossNow");
  await api("dismissDialogue");
  await api("setBossHpRatio", 0.75);
  await page.evaluate(() => window.advanceTime(17));
  const phase = await api("cutscene44");
  assert.equal(phase.phase, "PHASE 02");
  assert.match(phase.phaseCue, /镜卫|击破/);
  assert.equal(await page.locator("#dialoguePhase44.show").count(), 1);
  assert.equal(await page.locator("#dialoguePhase44 em.on").count(), 2);
  const dialogueBox = await page.locator("#dialogue .dialogueModal").boundingBox();
  assert.ok(dialogueBox && dialogueBox.x >= 0 && dialogueBox.y >= 0);
  assert.ok(dialogueBox.x + dialogueBox.width <= 932 && dialogueBox.y + dialogueBox.height <= 430);
  await shot("02-landscape-boss-phase.png");

  await api("dismissDialogue");
  await api("defeatBoss");
  await api("dismissDialogue");
  const result = await snapshot();
  assert.equal(result.mode, "result");
  assert.equal(result.result.win, true);
  const resultBox = await page.locator("#result .modal").boundingBox();
  const actionsBox = await page.locator("#result .actions").boundingBox();
  assert.ok(resultBox && resultBox.height <= 430 && resultBox.width <= 932);
  assert.ok(actionsBox && actionsBox.y >= 0 && actionsBox.y + actionsBox.height <= 430);
  assert.equal(await page.locator("#again").isVisible(), true);
  assert.equal(await page.locator("#back").isVisible(), true);
  assert.match(await page.locator("#damageReport").innerText(), /伤害构成|战斗诊断/);
  const resultHits = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const hit = (a, b) => {
      if (!a || !b) return 0;
      const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      return x * y;
    };
    const rank = box(document.getElementById("rankBig"));
    const actions = box(document.querySelector("#result .actions"));
    const title = box(document.getElementById("rtitle"));
    return { titleActions: hit(title, actions), rankActions: hit(rank, actions) };
  });
  assert.equal(resultHits.titleActions, 0, "结算标题不得盖住底栏按钮");
  assert.equal(resultHits.rankActions, 0, "结算评级不得盖住底栏按钮");
  await shot("03-landscape-result.png");

  await api("backMenu");
  await api("selectStage", 1);
  await api("start");
  await api("dismissDialogue");
  await api("protectPlayer");
  await api("triggerUpgrade");
  assert.equal((await snapshot()).mode, "level");
  const levelBox = await page.locator("#level .modal").boundingBox();
  const rerollBox = await page.locator("#reroll").boundingBox();
  assert.ok(levelBox && levelBox.height <= 430 && levelBox.width <= 932, "升级模态不得超出横屏视口");
  assert.ok(rerollBox && rerollBox.y >= 0 && rerollBox.y + rerollBox.height <= 430, "重抽按钮不得被裁切");
  await shot("04-landscape-levelup.png");
  await api("chooseUpgrade", 0);
  assert.equal((await snapshot()).mode, "play");

  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(externalRequests, []);
  fs.writeFileSync(
    path.join(artifactDir, "report.json"),
    JSON.stringify(
      {
        viewport: { width: 932, height: 430 },
        passed: [
          "测试模式跳过简报动画后能进对白/战场",
          "横屏战场铺满且触控按钮可见",
          "干员坞不盖住波次/任务/血条",
          "Boss 阶段机制条显示阶段、进度与应对提示",
          "横屏战术结算无需滚动即可看到报告与操作",
          "横屏升级模态重抽不被裁切",
          "无控制台错误和外部请求",
        ],
        screenshots,
      },
      null,
      2,
    ),
  );
  console.log("PASS landscape smoke: combat, boss phase direction, tactical result");
} finally {
  await context.close();
  await browser.close();
}

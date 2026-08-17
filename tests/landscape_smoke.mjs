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
  assert.equal(briefing.playing, true);
  assert.equal(briefing.sequence, "briefing");
  assert.match(await page.locator("#storyBeat44").innerText(), /OPERATION ORDER|神社外街/);
  await shot("00-landscape-operation-briefing.png");
  await api("dismissDialogue");
  await api("protectPlayer");
  await api("freezeProgression");
  await api("spawnEnemyNear", "normal", 110);
  await page.evaluate(() => window.advanceTime(1800));

  const combat = await snapshot();
  const canvas = await page.locator("#game").boundingBox();
  assert.equal(combat.mode, "play");
  assert.ok(combat.counts.enemies > 0);
  assert.ok(combat.build.attackTotal > 0);
  assert.ok(canvas && canvas.width >= 931 && canvas.height >= 429, "横屏画布没有铺满 932×430");
  assert.equal(await page.locator("#hud").isVisible(), true);
  assert.equal(await page.locator("#skill").isVisible(), true);
  assert.equal(await page.locator("#dash").isVisible(), true);
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
  await shot("03-landscape-result.png");

  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(externalRequests, []);
  fs.writeFileSync(
    path.join(artifactDir, "report.json"),
    JSON.stringify(
      {
        viewport: { width: 932, height: 430 },
        passed: [
          "出击先播放横屏作战简报再进入对白",
          "横屏战场铺满且触控按钮可见",
          "Boss 阶段机制条显示阶段、进度与应对提示",
          "横屏战术结算无需滚动即可看到报告与操作",
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

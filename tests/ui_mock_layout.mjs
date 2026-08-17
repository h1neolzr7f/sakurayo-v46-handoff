import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "src/index.html");
const outDir = path.join(root, "tests/artifacts/emulator");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

function overlap(a, b) {
  if (!a || !b) return 0;
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
}

async function run(label, viewport) {
  const context = await browser.newContext({
    viewport,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    localStorage.setItem("sakurayoV3", JSON.stringify({ tutorialDone: true }));
  });
  const page = await context.newPage();
  await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
  await page.waitForTimeout(400);
  const lobbyShot = path.join(outDir, `${label}-lobby.png`);
  await page.screenshot({ path: lobbyShot });
  const boxes = await page.evaluate(() => {
    const box = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    return {
      classes: [...document.documentElement.classList],
      start: box(document.getElementById("start")),
      nav: box(document.querySelector(".homeNav46")),
      more: box(document.getElementById("moreButton39")),
      title: box(document.getElementById("coverTitle36")),
      name: box(document.querySelector(".heroLiveName46")),
      menu: box(document.querySelector("#menu .menu")),
      rail: box(document.getElementById("homeRail46")),
      notice: box(document.querySelector('#homeRail46 [data-home="notice"]')),
      settings: box(document.querySelector('#homeRail46 [data-home="settings"]')),
      banner: box(document.getElementById("homeBanner46")),
      viewport: { w: innerWidth, h: innerHeight },
    };
  });
  const asBox = n => n && { x: n.x, y: n.y, width: n.w, height: n.h };
  const startNav = overlap(asBox(boxes.start), asBox(boxes.nav));
  const startMore = overlap(asBox(boxes.start), asBox(boxes.more));
  const nameNav = overlap(asBox(boxes.name), asBox(boxes.nav));
  const railBanner = overlap(asBox(boxes.rail), asBox(boxes.banner));
  const noticeBanner = overlap(asBox(boxes.notice), asBox(boxes.banner));
  const settingsBanner = overlap(asBox(boxes.settings), asBox(boxes.banner));
  const api = (method, ...args) => page.evaluate(({ method, args }) => window.__SAKURAYO_TEST__[method](...args), { method, args });
  await api("start");
  if (await page.locator("#tutorialDrawer37").isVisible()) {
    for (let i = 0; i < 4; i++) await page.locator("#tutorialNext37").click();
  }
  await api("dismissDialogue");
  await api("protectPlayer");
  await api("freezeProgression");
  await page.waitForTimeout(350);
  const combatShot = path.join(outDir, `${label}-combat.png`);
  await page.screenshot({ path: combatShot });
  const combat = await page.evaluate(() => {
    const box = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    return {
      hero: box(document.querySelector("#hud .hero")),
      ops: box(document.getElementById("opsDock46")),
      joy: box(document.getElementById("joy")),
      skill: box(document.getElementById("skill")),
      dash: box(document.getElementById("dash")),
      pause: box(document.getElementById("pause")),
      wave: box(document.querySelector(".wave")),
    };
  });
  await context.close();
  return { label, viewport, boxes, startNav, startMore, nameNav, railBanner, noticeBanner, settingsBanner, combat, lobbyShot, combatShot };
}

const wide = await run("50", { width: 932, height: 430 });
const short = await run("51", { width: 866, height: 287 });
await browser.close();
console.log(JSON.stringify({ wide, short }, null, 2));
for (const row of [wide, short]) {
  if (row.startNav > 4) throw new Error(row.label + " start/nav overlap " + row.startNav);
  if (row.startMore > 4) throw new Error(row.label + " start/more overlap " + row.startMore);
  if (row.nameNav > 4) throw new Error(row.label + " name/nav overlap " + row.nameNav);
  if (row.railBanner > 4) throw new Error(row.label + " rail/banner overlap " + row.railBanner);
  if (row.noticeBanner > 4) throw new Error(row.label + " notice/banner overlap " + row.noticeBanner);
  if (row.settingsBanner > 4) throw new Error(row.label + " settings/banner overlap " + row.settingsBanner);
}
console.log("PASS ui mock layout: no start/nav/more/name overlap");

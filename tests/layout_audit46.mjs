import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const fallback = path.join(os.homedir(), ".codex", "skills", "develop-web-game", "scripts", "node_modules", "playwright", "index.mjs");
    return await import(pathToFileURL(fallback).href);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "src/index.html");
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 932, height: 430 } });
await page.goto(`${pathToFileURL(source).href}?test=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForFunction(() => window.__SAKURAYO_TEST__ && document.getElementById("start"), null, { timeout: 30000 });
await page.waitForTimeout(600);

function box(sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      bottom: Math.round(r.bottom),
      right: Math.round(r.right),
      visible: r.width > 1 && r.height > 1 && st.visibility !== "hidden" && st.display !== "none",
      overflow: st.overflow,
    };
  }, sel);
}

function overlap(a, b) {
  if (!a || !b) return 0;
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
}

const report = { viewport: { w: 932, h: 430 }, issues: [], screens: {} };

const nav = await page.evaluate(() => {
  return [...document.querySelectorAll("#menu .homeNav46 button")].map((btn) => {
    const r = btn.getBoundingClientRect();
    const img = btn.querySelector("img");
    const ir = img ? img.getBoundingClientRect() : null;
    return {
      label: btn.textContent.trim(),
      w: Math.round(r.width),
      h: Math.round(r.height),
      icon: ir ? { w: Math.round(ir.width), h: Math.round(ir.height) } : null,
    };
  });
});
report.screens.lobby = {
  nav,
  start: await box("#start"),
  coins: await box("#menu .coins"),
  name: await box(".heroLiveName46"),
};
if (nav.some((n) => n.w < 44 || n.h < 44)) report.issues.push("lobby: nav hit < 44");
if (nav.some((n) => n.icon && n.icon.w < 40)) report.issues.push("lobby: nav icon < 40");
const startBox = report.screens.lobby.start;
const navBox = await box("#menu.homeDock46 .nav");
report.screens.lobby.navBox = navBox;
if (startBox && navBox && navBox.y - startBox.bottom > 28) {
  report.issues.push("lobby: start not docked to nav " + (navBox.y - startBox.bottom));
}
if (navBox && navBox.bottom < 400) report.issues.push("lobby: nav not at bottom " + navBox.bottom);
const navBg = await page.evaluate(() => {
  const btn = document.querySelector("#menu .homeNav46 button");
  if (!btn) return "";
  return getComputedStyle(btn).backgroundImage + " " + getComputedStyle(btn).backgroundColor;
});
if (/linear-gradient|#18112f|#0c0a1b/i.test(navBg)) report.issues.push("lobby: nav still has square plate " + navBg);

await page.evaluate(() => window.__SAKURAYO_TEST__.grantCheat46());
await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("gacha"));
await page.waitForSelector("#gachaPull1", { timeout: 10000 });
await page.waitForTimeout(300);
const toast = await box("#toast");
const closeGacha = await box("#gachaDrawer .close");
const pity = await box(".wishPity46");
const dock = await box(".wishDock46");
report.screens.gacha = {
  toastVisible: !!(toast && toast.visible),
  toastCloseOverlap: overlap(toast, closeGacha),
  pityDockOverlap: overlap(pity, dock),
  pity,
  dock,
  sparkToggle: await box("#gachaSparkToggle46"),
};
if (toast && toast.visible) report.issues.push("gacha: toast visible over drawer");
if (overlap(pity, dock) > 8) report.issues.push("gacha: pity overlaps dock " + overlap(pity, dock));
if (pity && dock && dock.y - pity.bottom > 28) report.issues.push("gacha: pity floats above dock " + (dock.y - pity.bottom));

await page.evaluate(() => window.__SAKURAYO_TEST__.pullGacha46(1));
await page.waitForSelector("#gachaReveal46", { timeout: 8000 });
const reveal = await box("#gachaReveal46");
const closeOnReveal = await page.evaluate(() => {
  const close = document.querySelector("#gachaDrawer .close");
  const r = close.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { hitsClose: !!(el && (el === close || close.contains(el))), overlayTop: document.getElementById("gachaReveal46")?.contains(el) };
});
report.screens.reveal = { reveal, closeOnReveal, toastVisible: !!(await box("#toast"))?.visible };
if (!closeOnReveal.hitsClose) report.issues.push("reveal: close not clickable");

await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("shop"));
await page.waitForSelector("#shopDrawer", { timeout: 8000 });
await page.waitForTimeout(300);
const shopBuy = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("#shopList .skinCard")];
  return cards.slice(0, 4).map((card) => {
    const btn = card.querySelector("button");
    const preview = card.querySelector(".skinPreview");
    const r = btn.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const pr = preview ? preview.getBoundingClientRect() : { width: 0, height: 0 };
    return {
      name: card.querySelector("h3")?.textContent || "",
      btnInView: r.bottom <= 430 && r.top >= 0 && r.height > 8,
      btnInCard: r.bottom <= cr.bottom + 1,
      clipped: getComputedStyle(card).overflow !== "visible" && r.bottom > cr.bottom + 1,
      btnBottom: Math.round(r.bottom),
      cardBottom: Math.round(cr.bottom),
      previewW: Math.round(pr.width),
      previewH: Math.round(pr.height),
    };
  });
});
report.screens.shop = { shopBuy, toastVisible: !!(await box("#toast"))?.visible };
if (shopBuy.some((c) => !c.btnInView || c.clipped)) report.issues.push("shop: buy button clipped or offscreen");
if (shopBuy.some((c) => Math.min(c.previewW, c.previewH) < 110)) report.issues.push("shop: preview still a thin strip");

await page.evaluate(() => window.__SAKURAYO_TEST__.openDrawer("stage"));
await page.waitForSelector("#modeBar46", { timeout: 8000 });
await page.waitForTimeout(300);
const stage = await page.evaluate(() => {
  const card = document.querySelector("#stageList .stageCard");
  const title = card?.querySelector("h3");
  const btns = [...(card?.querySelectorAll("button") || [])].map((b) => b.getBoundingClientRect());
  const tag = card?.querySelector(".rankTag")?.getBoundingClientRect();
  const caption = card?.querySelector(".i")?.getBoundingClientRect();
  let btnGap = null;
  if (btns.length >= 2) btnGap = Math.round(btns[1].left - btns[0].right);
  return {
    titleInCaption: title && caption ? title.getBoundingClientRect().bottom <= caption.bottom + 2 : false,
    btnGap,
    tagBottom: tag ? Math.round(tag.bottom) : null,
    captionTop: caption ? Math.round(caption.top) : null,
  };
});
report.screens.stage = stage;
if (stage.btnGap != null && stage.btnGap < 6) report.issues.push("stage: action buttons gap " + stage.btnGap);

await browser.close();
console.log(JSON.stringify(report, null, 2));
if (report.issues.length) {
  console.error("AUDIT FAIL", report.issues);
  process.exit(1);
}
console.log("AUDIT PASS");

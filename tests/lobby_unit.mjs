import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8");
const sandbox = { window: {}, document: null, Math, Date, Object, Array, Number, String };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const L = sandbox.window.SakurayoLobby;

assert.equal(L.version, "4.7.0");
assert.equal(L.CARDS.length, 16);
assert.deepEqual([...L.DEFAULT_SHOWN], ["sayo_echo", "aya_petal"]);
for (const card of L.CARDS) {
  assert.equal(
    fs.existsSync(path.join(root, "android-app/app/src/main/assets/game/art/gacha", `${card.id}.webp`)),
    true,
    `缺少寻访卡面 ${card.id}.webp`,
  );
}
assert.equal(L.RATES.single, 160);
assert.equal(L.RATES.ten, 1440);
assert.equal(L.RATES.SSR, 0.01);
assert.equal(L.RATES.pitySSR, 80);
assert.ok(L.upIds("moon").includes("sayo_echo"));
assert.ok(L.upIds("fate").includes("aya_petal"));
assert.equal(L.upIds("normal").length, 0);
const moonN = L.weightPool("N", "moon").filter((c) => c.id === "sayo_echo").length;
const moonAya = L.weightPool("N", "moon").filter((c) => c.id === "aya_petal").length;
assert.ok(moonN > moonAya);

const old = { coins: 90, shop40: {} };
const shop = L.normalizeOps(old.shop40);
old.shop40 = shop;
assert.equal(shop.ops.owned.sayo_echo, 1);
assert.equal(shop.ops.owned.aya_petal, 1);
assert.equal(shop.ops.owned.last_witness, 0);
assert.equal(shop.ops.owned.mirror_twins, 0);
assert.equal(L.snapshot(old).shown.includes("sayo_echo"), true);

const legacyEight = L.normalizeOps({
  ops: {
    pity: 27,
    pitySR: 4,
    pulls: 31,
    owned: { sayo_echo: 3, aya_petal: 2, last_witness: 1 },
  },
});
assert.equal(legacyEight.ops.owned.sayo_echo, 3);
assert.equal(legacyEight.ops.owned.last_witness, 1);
assert.equal(legacyEight.ops.owned.sayo_318, 0);
assert.equal(legacyEight.ops.owned.mirror_twins, 0);
assert.equal(legacyEight.ops.pity, 27);
assert.equal(legacyEight.ops.pulls, 31);

const poor = { coins: 10, shop40: L.normalizeOps({}) };
const denied = L.pull(poor, 1, () => 0);
assert.equal(denied.ok, false);
assert.equal(denied.reason, "coins");
assert.equal(poor.coins, 10);
const ticketPay = { coins: 10, shop40: L.normalizeOps({}), shell46: { ticket: 1, energy: 0 } };
const ticketPull = L.pull(ticketPay, 1, () => 0.999, "moon");
assert.equal(ticketPull.ok, true);
assert.equal(ticketPull.paid, "ticket");
assert.equal(ticketPay.coins, 10);
assert.equal(ticketPay.shell46.ticket, 0);
assert.equal(ticketPay.shell46.energy, 1);
const energyPay = { coins: 20000, shop40: L.normalizeOps({}), shell46: { ticket: 0, energy: 49 } };
const energyPull = L.pull(energyPay, 1, () => 0.999, "normal");
assert.equal(energyPull.ok, true);
assert.equal(energyPull.energyGrant, 1);
assert.equal(energyPay.shell46.energy, 0);
assert.equal(energyPay.shell46.ticket, 1);

const rich = { coins: 20000, shop40: L.normalizeOps({}) };
const one = L.pull(rich, 1, () => 0.999);
assert.equal(one.ok, true);
assert.equal(one.results.length, 1);
assert.equal(rich.coins, 20000 - 160);
assert.equal(rich.shop40.ops.pulls, 1);

const ten = L.pull(rich, 10, () => 0.5);
assert.equal(ten.ok, true);
assert.equal(ten.results.length, 10);
assert.equal(rich.shop40.ops.tenPulls, 1);
assert.equal(rich.coins, 20000 - 160 - 1440);

const pitySave = { coins: 20000, shop40: L.normalizeOps({}) };
pitySave.shop40.ops.pity = 79;
const forced = L.pull(pitySave, 1, () => 0.999);
assert.equal(forced.results[0].r, "SSR");
assert.ok(["last_witness", "mirror_twins"].includes(forced.results[0].id));
assert.equal(pitySave.shop40.ops.pity, 0);

const cheat = L.grantCheat({ coins: 3, shop40: L.normalizeOps({}) });
assert.equal(cheat.coins, 3 + 9999);
assert.equal(cheat.cheatUsed, 1);
assert.deepEqual(Object.keys(L.snapshot(old).cards[0]).sort(), ["count", "id", "n", "r"]);
assert.equal(typeof L.showReveal, "function");
assert.equal(typeof L.injectStyle, "function");
const lobbySrc = fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8");
assert.match(lobbySrc, /@media\(orientation:landscape\)\{/);
assert.match(lobbySrc, /homeBanner46\{display:grid;.*left:max\(80px/);
assert.match(lobbySrc, /shortWindow46 \.revealGrid46\.ten \.revealCard46\{height:68px\}/);
assert.match(lobbySrc, /@media\(max-height:430px\)\{html\.landscape46 \.revealGrid46\.ten \.revealCard46\{height:68px\}/);
assert.match(lobbySrc, /revealSkip46.*min-width:72px/);
assert.doesNotMatch(lobbySrc, /12天22时/);
assert.doesNotMatch(fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8"), /orientation:landscape\) and \(min-width:700px\)/);
assert.match(fs.readFileSync(path.join(root, "src/index.html"), "utf8"), /class="landscape46"/);
assert.match(fs.readFileSync(path.join(root, "src/index.html"), "utf8"), /classList\.add\("landscape46"\)/);

const tap9 = Array.from({ length: 9 }, (_, i) => L.portraitTap(1000 + i));
assert.equal(tap9[8].granted, false);
const tap10 = L.portraitTap(1009);
assert.equal(tap10.granted, true);

function fakeEl(tag, attrs = {}) {
  const node = {
    tagName: String(tag).toUpperCase(),
    id: attrs.id || "",
    className: attrs.className || "",
    children: [],
    parentNode: null,
    isConnected: true,
    style: {},
    attrs: { ...attrs },
    _html: "",
    onclick: null,
    onerror: null,
    textContent: "",
    setAttribute(k, v) {
      this.attrs[k] = v;
      if (k === "id") this.id = v;
      if (k === "class") this.className = v;
    },
    getAttribute(k) {
      return this.attrs[k] == null ? null : String(this.attrs[k]);
    },
    appendChild(c) {
      this.children.push(c);
      c.parentNode = this;
      return c;
    },
    removeChild(c) {
      this.children = this.children.filter((x) => x !== c);
      c.parentNode = null;
      return c;
    },
    querySelector(sel) {
      return collect(this).find((n) => matchSel(n, sel)) || null;
    },
    querySelectorAll(sel) {
      return collect(this).filter((n) => matchSel(n, sel));
    },
    get innerHTML() {
      return this._html;
    },
    set innerHTML(v) {
      this._html = String(v || "");
      this.children = parseHtml(this._html, this);
    },
  };
  return node;
}
function collect(root, acc = []) {
  for (const child of root.children || []) {
    acc.push(child);
    collect(child, acc);
  }
  return acc;
}
function matchSel(n, sel) {
  if (sel.startsWith("#")) return n.id === sel.slice(1);
  if (sel.startsWith(".")) return (` ${n.className} `).includes(` ${sel.slice(1)} `);
  if (sel.includes("[data-art]")) return n.tagName === "IMG";
  if (sel === "[data-open]") return n.getAttribute("data-open") != null;
  return n.tagName === String(sel).toUpperCase();
}
function parseHtml(html, parent) {
  const found = [];
  const tagRe = /<([a-z0-9]+)([^>]*)>/gi;
  let m;
  while ((m = tagRe.exec(html))) {
    const raw = m[2] || "";
    const id = (raw.match(/\sid="([^"]+)"/) || [])[1] || "";
    const cls = (raw.match(/\sclass="([^"]+)"/) || [])[1] || "";
    const dataCard = (raw.match(/\sdata-card="([^"]+)"/) || [])[1] || "";
    const node = fakeEl(m[1], { id, className: cls, "data-card": dataCard });
    node.parentNode = parent;
    found.push(node);
  }
  return found;
}

const head = fakeEl("head");
const body = fakeEl("body");
const allNodes = () => collect(head).concat(collect(body));
const document = {
  head,
  body,
  documentElement: fakeEl("html"),
  getElementById(id) {
    return allNodes().find((n) => n.id === id) || null;
  },
  createElement(tag) {
    return fakeEl(tag);
  },
};
const vis = { document, Math, Date, Object, Array, Number, String, TEST_MODE: true, setTimeout(fn) { fn(); } };
vis.window = vis;
vis.globalThis = vis;
vm.runInNewContext(code, vis);
const V = vis.window.SakurayoLobby;
V.injectStyle();
assert.equal(document.getElementById("sakurayo-lobby-css").id, "sakurayo-lobby-css");
const firstCss = document.getElementById("sakurayo-lobby-css");
V.injectStyle();
const secondCss = document.getElementById("sakurayo-lobby-css");
assert.ok(secondCss);
assert.notEqual(firstCss, secondCss);
assert.equal(head.children.filter((n) => n.id === "sakurayo-lobby-css").length, 1);

const gachaHost = fakeEl("div", { id: "gachaBody46" });
body.appendChild(gachaHost);
const save = { coins: 20000, character: "sayo", shop40: V.normalizeOps({}) };
V.renderGacha(gachaHost, save, { pull() {}, art: (p) => "game/art/" + p, character: "sayo" });
assert.match(gachaHost.innerHTML, /id="gachaPull1"/);
assert.match(gachaHost.innerHTML, /id="gachaPull10"/);
assert.match(gachaHost.innerHTML, /镜界寻访/);
assert.match(gachaHost.innerHTML, /160/);
assert.match(gachaHost.innerHTML, /1440/);
assert.match(gachaHost.innerHTML, /距证人保底还有/);
assert.ok(gachaHost.querySelector("#gachaPull1"));
assert.ok(gachaHost.querySelector("#gachaPull10"));
V.renderGacha(gachaHost, save, { pull() {}, art: (p) => "game/art/" + p, character: "sayo", tickets: 3 });
assert.match(gachaHost.innerHTML, /寻访券 3/);

const rosterDrawer = fakeEl("section", { id: "rosterDrawer" });
rosterDrawer.className = "drawer wishDrawer46";
const rosterHost = fakeEl("div", { id: "rosterBody46" });
body.appendChild(rosterDrawer);
rosterDrawer.appendChild(rosterHost);
V.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.equal((rosterHost.innerHTML.match(/class="rosterSlot46/g) || []).length, 16);
assert.match(rosterHost.innerHTML, /id="rosterWall46"/);
assert.match(rosterHost.innerHTML, /未回收/);
assert.match(rosterHost.innerHTML, /rosterSlot46 r-SSR lock" data-card="last_witness"/);
assert.match(rosterHost.innerHTML, /rosterSlot46 r-N" data-card="sayo_echo"/);
assert.match(rosterHost.innerHTML, /rosterSlot46 r-N" data-card="aya_petal"/);
assert.match(rosterHost.innerHTML, /card_back\.webp/);
assert.equal(rosterHost.innerHTML.includes("last_witness.webp"), false);

const drawer = fakeEl("section", { id: "gachaDrawer" });
drawer.className = "drawer wishDrawer46";
body.appendChild(drawer);
V.showReveal([{ id: "last_witness", n: "终章证人立绘", r: "SSR" }], { art: (p) => "game/art/" + p });
const reveal = document.getElementById("gachaReveal46");
assert.ok(reveal);
assert.match(reveal.innerHTML, /收下证词/);
assert.match(reveal.innerHTML, /revealCard46/);
assert.match(reveal.innerHTML, /revealGem46/);
assert.match(reveal.innerHTML, /镜界开印/);
assert.match(reveal.innerHTML, /revealSum46/);
assert.match(reveal.innerHTML, /单次寻访/);
V.showReveal(
  [
    { id: "last_witness", n: "终章证人立绘", r: "SSR" },
    { id: "sayo_echo", n: "小夜残响", r: "N" },
    { id: "mirror_twins", n: "镜中双生", r: "SSR" },
  ],
  { art: (p) => "game/art/" + p },
);
const tenReveal = document.getElementById("gachaReveal46");
assert.match(tenReveal.innerHTML, /十连证词/);
const tenCards = tenReveal.querySelectorAll(".revealCard46");
assert.equal(tenCards[0].getAttribute("data-card"), "sayo_echo");
assert.equal(tenCards[1].getAttribute("data-card"), "last_witness");
assert.equal(tenCards[2].getAttribute("data-card"), "mirror_twins");

const locked = collect(rosterHost).find((n) => (` ${n.className} `).includes(" lock "));
assert.ok(locked);
locked.onclick();
const peek = document.getElementById("rosterPeek46");
assert.ok(peek);
assert.match(peek.innerHTML, /尚未回收/);
assert.match(peek.innerHTML, /card_back\.webp/);

const heroRoot = fakeEl("div");
body.appendChild(heroRoot);
V.bindHeroTap(heroRoot, () => {});
assert.equal(heroRoot.querySelector("#heroTap46").id, "heroTap46");
assert.equal(heroRoot.querySelector("#heroHead46").id, "heroHead46");

const modes = V.renderStageModes("testimony");
assert.match(modes, /id="modeBar46"/);
assert.match(modes, /id="modeTestimony46"/);
assert.match(modes, /id="modeStory46"/);
assert.match(modes, /id="modeMainGod46"/);
assert.match(modes, /回收演习/);
assert.match(modes, /证词模式/);
assert.match(modes, /主神空间/);
assert.match(modes, /高难轮回/);
assert.match(modes, /id="modeTestimony46"[^>]*class="on"/);
assert.match(V.renderStageModes("story"), /id="modeStory46"[^>]*class="on"/);
assert.match(V.renderStageModes("mainGod"), /id="modeMainGod46"[^>]*class="on"/);

const indexSrc = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
assert.match(indexSrc, /const mainGodOpen36=\(\)=>true/);
assert.match(indexSrc, /data-mode="mainGod"><b>主神<\/b><small>高难轮回<\/small>/);
assert.match(indexSrc, /const unlockedGod = mainGodOpen36\(\)/);
assert.doesNotMatch(indexSrc, /通关第4章后解锁主神空间/);
assert.doesNotMatch(indexSrc, /unlockedGod = \(save\.done \|\| \[\]\)\.includes\(4\)/);
assert.doesNotMatch(indexSrc, /if \(!unlockedGod && pendingMode46 === "mainGod"\)/);
assert.doesNotMatch(indexSrc, /btn\.hidden = !unlockedGod/);
assert.match(fs.readFileSync(path.join(root, "src/content/packs/maingod-void/pack.js"), "utf8"), /主神空间默认可进/);

const archiveHost = fakeEl("div", { className: "archiveDock46" });
for (const [id, label] of [["talent", "永久天赋"], ["story", "剧情档案"], ["asc", "职业与飞升"], ["ach", "成就图鉴"]]) {
  const btn = fakeEl("button", { "data-open": id });
  btn.innerHTML = label;
  archiveHost.appendChild(btn);
}
V.dressArchive(archiveHost);
const storyBtn = archiveHost.children.find((n) => n.getAttribute("data-open") === "story");
assert.match(storyBtn.innerHTML, /<b>剧情档案<\/b><small>四章证词<\/small>/);
assert.match(archiveHost.children[0].innerHTML, /永久天赋/);
assert.equal(archiveHost.children.find((n) => n.getAttribute("data-open") === "ach"), undefined);

console.log("PASS lobby unit: rates, default two cards, pity, ten-pull, cheat taps, stage modes");

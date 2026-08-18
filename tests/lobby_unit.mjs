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

assert.equal(L.version, "4.6.0");
assert.equal(L.CARDS.length, 8);
assert.deepEqual([...L.DEFAULT_SHOWN], ["sayo_echo", "aya_petal"]);
assert.deepEqual([...L.POOL_IDS], ["remnant", "fashion", "weapon"]);
assert.deepEqual([...L.ROSTER_TABS], ["scrap", "school"]);
assert.equal(L.RATES.single, 160);
assert.equal(L.RATES.ten, 1440);
assert.equal(L.RATES.SSR, 0.01);
assert.equal(L.RATES.pitySSR, 80);
assert.equal(L.RATES.softPity, 65);
assert.equal(L.RATES.spark, 200);
assert.ok(L.CARDS.every((card) => card.r === "R" && card.kind === "scrap"));
assert.ok(L.CARDS.every((card) => Array.isArray(card.lore) && card.lore.length === 4));
assert.equal(L.cardOf("last_witness").n, "碎镜后的人");
assert.match(L.cardOf("last_witness").lore[0], /他不是小夜/);
["school_shrine","school_idol","school_magical","school_mech","school_spore","school_gun","school_mage","school_alch","school_ninja","school_vamp","school_cult","school_necro","school_gene","school_summon"].forEach((id) => {
  const art = path.join(root, "android-app/app/src/main/assets/game/art/gacha", id + ".webp");
  assert.equal(fs.existsSync(art), true, "missing " + id);
  assert.ok(fs.statSync(art).size > 8000, id + " too small");
});
["sayo_echo","aya_petal","rion_edge","night_radio","shrine_seal","void_ticket","cherry_crown","last_witness","banner_bg","card_back","hero_sayo","hero_aya","hero_rion"].forEach((id) => {
  assert.equal(fs.existsSync(path.join(root, "android-app/app/src/main/assets/game/art/gacha", id + ".webp")), true);
});

const fresh = { coins: 90, shop40: {} };
const shop = L.normalizeOps(fresh.shop40);
fresh.shop40 = shop;
assert.equal(shop.ops.owned.sayo_echo, 1);
assert.equal(shop.ops.owned.aya_petal, 1);
assert.equal(shop.ops.owned.last_witness, 0);
assert.equal(shop.ops.pool, "remnant");
assert.equal(typeof shop.ops.shards, "number");
assert.ok(shop.ops.fashion && typeof shop.ops.fashion.pity === "number");
assert.ok(shop.ops.weapon && typeof shop.ops.weapon.pity === "number");
assert.equal(L.snapshot(fresh).shown.includes("sayo_echo"), true);
assert.deepEqual([...L.snapshot(fresh).pages], ["remnant", "fashion", "weapon"]);

const old = { coins: 90, shop40: { ops: { pity: 17, owned: { sayo_echo: 2 } } } };
const migrated = L.normalizeOps(old.shop40);
old.shop40 = migrated;
assert.equal(migrated.ops.pity, 17);
assert.equal(migrated.ops.owned.sayo_echo, 2);
assert.equal(migrated.ops.owned.aya_petal, 0);

const poor = { coins: 10, shop40: L.normalizeOps({}) };
const denied = L.pull(poor, 1, () => 0);
assert.equal(denied.ok, false);
assert.equal(denied.reason, "coins");
assert.equal(poor.coins, 10);

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
assert.notEqual(forced.results[0].r, "SSR");
assert.equal(forced.results[0].r, "R");
assert.ok(L.CARDS.some((card) => card.id === forced.results[0].id));
assert.notEqual(forced.results[0].r, "SSR");

const emptyPool = { coins: 20000, shop40: L.normalizeOps({}) };
const fashionDenied = L.pull(emptyPool, 1, () => 0, "fashion");
assert.equal(fashionDenied.ok, false);
assert.equal(fashionDenied.reason, "empty");
assert.equal(emptyPool.coins, 20000);

const bonusP = { crit: 0.05, spd: 220, dmg: 18, bladePower: 1, skillCd: 7, damageReduce: 0, maxSh: 0, sh: 0, maxHp: 100, hp: 100, character: "sayo" };
const bonusSave = { character: "sayo", shop40: L.normalizeOps({}) };
bonusSave.shop40.ops.owned.sayo_echo = 1;
bonusSave.shop40.ops.owned.cherry_crown = 1;
L.applyOwnedBonus(bonusP, bonusSave);
assert.ok(Math.abs(bonusP.crit - 0.055) < 1e-9);
assert.ok(Math.abs(bonusP.dmg - 18 * 1.008) < 1e-6);

const allBonusP = { crit: 0.05, spd: 200, dmg: 20, bladePower: 1, skillCd: 10, damageReduce: 0, maxSh: 0, sh: 0, maxHp: 100, hp: 80, character: "rion" };
const allBonusSave = { character: "rion", shop40: L.normalizeOps({}) };
L.CARDS.forEach((card) => { allBonusSave.shop40.ops.owned[card.id] = 2; });
L.applyOwnedBonus(allBonusP, allBonusSave);
assert.ok(Math.abs(allBonusP.crit - 0.055) < 1e-9);
assert.ok(Math.abs(allBonusP.spd - 200 * 1.005) < 1e-6);
assert.ok(Math.abs(allBonusP.bladePower - 1.01) < 1e-9);
assert.ok(Math.abs(allBonusP.skillCd - 10 * 0.995) < 1e-6);
assert.ok(Math.abs(allBonusP.damageReduce - 0.004) < 1e-9);
assert.equal(allBonusP.maxSh, 4);
assert.equal(allBonusP.sh, 4);
assert.ok(Math.abs(allBonusP.dmg - 20 * 1.01 * 1.008) < 1e-6);
assert.ok(Math.abs(allBonusP.maxHp - 101) < 1e-6);
assert.equal(allBonusP.hp, allBonusP.maxHp);

const shardSave = { coins: 20000, shop40: L.normalizeOps({}) };
L.CARDS.forEach((card) => { shardSave.shop40.ops.owned[card.id] = 1; });
const shardsBefore = shardSave.shop40.ops.shards;
const dupe = L.pull(shardSave, 1, () => 0.5);
assert.equal(dupe.ok, true);
assert.equal(shardSave.shop40.ops.shards, shardsBefore + 1 + 8);

const cheat = L.grantCheat({ coins: 3, shop40: L.normalizeOps({}) });
assert.equal(cheat.coins, 3 + 9999);
assert.equal(cheat.cheatUsed, 1);
assert.deepEqual(Object.keys(L.snapshot(old).cards[0]).sort(), ["count", "id", "kind", "n", "r"]);
assert.equal(typeof L.showReveal, "function");
assert.equal(typeof L.injectStyle, "function");
assert.match(fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8"), /@media\(orientation:landscape\)\{/);
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
assert.match(gachaHost.innerHTML, /data-pool="remnant"/);
assert.match(gachaHost.innerHTML, /data-pool="fashion"/);
assert.match(gachaHost.innerHTML, /data-pool="weapon"/);
assert.match(gachaHost.innerHTML, /碎镜片/);
assert.ok(gachaHost.querySelector("#gachaPull1"));
assert.ok(gachaHost.querySelector("#gachaPull10"));

const rosterDrawer = fakeEl("section", { id: "rosterDrawer" });
rosterDrawer.className = "drawer wishDrawer46";
const rosterHost = fakeEl("div", { id: "rosterBody46" });
body.appendChild(rosterDrawer);
rosterDrawer.appendChild(rosterHost);
V.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.equal((rosterHost.innerHTML.match(/class="rosterSlot46/g) || []).length, 8);
assert.match(rosterHost.innerHTML, /id="rosterWall46"/);
assert.match(rosterHost.innerHTML, /未回收/);
assert.match(rosterHost.innerHTML, /镜界仓库/);
assert.match(rosterHost.innerHTML, /data-roster="scrap"/);
assert.match(rosterHost.innerHTML, /data-roster="school"/);
assert.match(rosterHost.innerHTML, /rosterSlot46 r-R lock" data-card="last_witness"/);
assert.match(rosterHost.innerHTML, /rosterSlot46 r-R" data-card="sayo_echo"/);
assert.match(rosterHost.innerHTML, /rosterSlot46 r-R" data-card="aya_petal"/);
assert.match(rosterHost.innerHTML, /card_back\.webp/);
assert.equal(rosterHost.innerHTML.includes("last_witness.webp"), false);

const drawer = fakeEl("section", { id: "gachaDrawer" });
drawer.className = "drawer wishDrawer46";
body.appendChild(drawer);
V.showReveal([{ id: "last_witness", n: "碎镜后的人", r: "R" }], { art: (p) => "game/art/" + p });
const reveal = document.getElementById("gachaReveal46");
assert.ok(reveal);
assert.match(reveal.innerHTML, /收下证词/);
assert.match(reveal.innerHTML, /revealCard46/);
assert.match(reveal.innerHTML, /revealGem46/);
assert.match(fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8"), /\.revealLegend46\{/);
assert.match(fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8"), /\.revealCard46\.r-LEGEND/);
V.showReveal([{ id: "fashion_sayo_crown", n: "终夜樱冠", r: "SSR", legend: true }], { art: (p) => "game/art/" + p });
assert.match(document.getElementById("gachaReveal46").innerHTML, /revealLegend46/);
assert.match(document.getElementById("gachaReveal46").innerHTML, /传说/);

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
assert.match(modes, /id="modeTestimony46"[^>]*class="on"/);
assert.match(V.renderStageModes("story"), /id="modeStory46"[^>]*class="on"/);

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

console.log("PASS lobby unit: rates, default two cards, pity, ten-pull, cheat taps, stage modes");

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lobbySrc = fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8");
const chronicleSrc = fs.readFileSync(path.join(root, "src/runtime/sakurayo-chronicle.js"), "utf8");
const indexSrc = fs.readFileSync(path.join(root, "src/index.html"), "utf8");

assert.match(indexSrc, /sakurayo-lobby\.js[\s\S]*sakurayo-chronicle\.js[\s\S]*sakurayo-live\.js/);
assert.equal(indexSrc.includes("runtime/sakurayo-chronicle.js"), true);

const SAYO_LOCKED = [
  { id: "ch_zero_death", n: "第零次死亡", lore: ["三年前我就死在镜界实验里。神社扫地的那个人，可能只是备份。", "他们把我的名字写回名册，像把打翻的水倒回杯里。水已经不是原来那杯。", "我记得冷，记得镜核亮起来，不记得谁把我从名册上擦掉。", "如果现在的我是备份，那第一夜的我，还欠一句再见。"] },
  { id: "ch_hundred_eyes", n: "百目共视", lore: ["百目不是监视器。是很多双已经死过的眼睛，叠在同一副眼眶里。", "每次有人走进镜核，那些眼睛就替我再看一次。看到的都是同一条死路。", "绫说企业管这叫采集。凛音说黄泉流早写过。我只觉得眼睛不够用。", "共视结束的时候，没有人眨眼。"] },
  { id: "ch_zero_corp", n: "零号企业", lore: ["绫的企业不生产枪，生产可替换的人。我是被拆借过的零件之一。", "他们把「会怕」单独装进一间实验室，把「还会回来」装进另一间。", "巫女那一夜不是这条线。这条线没有符，只有工号和作废券。", "拆完以后，他们说还可以再组装一个小夜。价格另议。"] },
  { id: "ch_sword_mound", n: "失败者剑冢", lore: ["剑冢里每一把剑都是一条没走到核心的我。所有小夜都来过，没人留下脚印。", "我数过，数到后来不敢数。刀柄上的名字有的是我，有的快要不是。", "凛音从旁边走过，没有鞠躬。她认得这些刀，比我更认得。", "核心还在最里面。我们都走到过门口，门上没有锁，只有上一夜的我。"] },
  { id: "ch_after_zero", n: "镜零之后", lore: ["镜零是失败的小夜训练出来的。训练的不是胜利，是怎么把下一夜送回去。", "碎镜以后又醒来一个我。她问这是第几次。我没有数字可以给她。", "电台还在播，封条还在写同一个字。备份和原件已经吵不清楚。", "如果还有下一夜，让她别再把我写成一张完整的卡。"] },
];

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
    const node = fakeEl(m[1], { id, className: cls });
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
const sandbox = { document, Math, Date, Object, Array, Number, String };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.runInNewContext(lobbySrc + "\n" + chronicleSrc, sandbox);

const L = sandbox.window.SakurayoLobby;
const C = sandbox.window.SakurayoChronicle;
assert.ok(L);
assert.ok(C);
assert.equal(L.CHRONICLE.length, 5);
assert.equal(
  JSON.stringify(L.CHRONICLE.map((item) => ({ id: item.id, n: item.n, lore: [...item.lore] }))),
  JSON.stringify(SAYO_LOCKED)
);
assert.equal([...C.TITLES].join("|"), "月城小夜 · 未写完的夜|神代绫 · 作废的工号|黑羽凛音 · 未署名的刀");
assert.equal(C.CHRONICLE_AYA.length, 4);
assert.equal(C.CHRONICLE_RION.length, 4);
assert.equal(C.CHRONICLE_AYA.map((item) => item.id).join(","), "ch_aya_badge,ch_aya_void,ch_aya_petal,ch_aya_seam");
assert.equal(C.CHRONICLE_RION.map((item) => item.id).join(","), "ch_rion_page,ch_rion_mound,ch_rion_unsaid,ch_rion_bride");
assert.equal(C.CHRONICLE_AYA.map((item) => item.n).join(","), "工牌还在,作废回收,花比刀快,镜缝本体");
assert.equal(C.CHRONICLE_RION.map((item) => item.n).join(","), "刀背署名,剑冢旁观,没有道号,无人掀盖");
C.CHRONICLE_AYA.concat(C.CHRONICLE_RION).forEach((item) => {
  assert.equal(item.lore.length, 4);
  assert.ok(item.lore.some((line) => line.includes("我")));
  item.lore.forEach((line) => {
    assert.equal(/\+\d+%/.test(line), false);
    assert.ok([...line].filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length > 8);
  });
});
assert.equal(L.renderRoster.__chronicleSides, true);

const rosterHost = fakeEl("div", { id: "rosterBody46" });
body.appendChild(rosterHost);
const save = { coins: 20000, character: "sayo", shop40: L.normalizeOps({}) };
L.setRosterTab(save, "chronicle");
L.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });

assert.match(rosterHost.innerHTML, /月城小夜 · 未写完的夜/);
assert.match(rosterHost.innerHTML, /神代绫 · 作废的工号/);
assert.match(rosterHost.innerHTML, /黑羽凛音 · 未署名的刀/);
assert.equal(rosterHost.innerHTML.includes("三角色 · 未写完的夜"), false);
assert.match(rosterHost.innerHTML, /第零次死亡/);
assert.match(rosterHost.innerHTML, /镜零之后/);
assert.match(rosterHost.innerHTML, /工牌还在/);
assert.match(rosterHost.innerHTML, /作废回收/);
assert.match(rosterHost.innerHTML, /花比刀快/);
assert.match(rosterHost.innerHTML, /镜缝本体/);
assert.match(rosterHost.innerHTML, /刀背署名/);
assert.match(rosterHost.innerHTML, /剑冢旁观/);
assert.match(rosterHost.innerHTML, /没有道号/);
assert.match(rosterHost.innerHTML, /无人掀盖/);
assert.equal((rosterHost.innerHTML.match(/class="chronicleCard46/g) || []).length, 13);
assert.equal((rosterHost.innerHTML.match(/<h4>/g) || []).length, 3);
assert.match(rosterHost.innerHTML, /data-chronicle-sides="1"/);
assert.equal((rosterHost.innerHTML.match(/data-roster="chronicle"/g) || []).length, 1);
assert.equal(rosterHost.innerHTML.includes("school_gun"), false);
assert.equal(document.getElementById("sakurayo-chronicle-css").id, "sakurayo-chronicle-css");

L.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.equal((rosterHost.innerHTML.match(/class="chronicleCard46/g) || []).length, 13);
assert.equal((rosterHost.innerHTML.match(/data-chronicle="ch_aya_badge"/g) || []).length, 1);

L.setRosterTab(save, "scrap");
L.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.equal(rosterHost.innerHTML.includes("神代绫 · 作废的工号"), false);
assert.equal((rosterHost.innerHTML.match(/class="rosterSlot46/g) || []).length, 8);

assert.doesNotMatch(lobbySrc, /ch_aya_badge/);
assert.doesNotMatch(lobbySrc, /神代绫 · 作废的工号/);
assert.doesNotMatch(lobbySrc, /黑羽凛音 · 未署名的刀/);
assert.doesNotMatch(chronicleSrc, /ch_aya_sign|ch_aya_parts|ch_aya_one|ch_rion_dojo|ch_rion_ledger|ch_rion_living/);
assert.doesNotMatch(chronicleSrc, /三角色 · 未写完的夜/);
assert.match(lobbySrc, /月城小夜 · 未写完的夜/);

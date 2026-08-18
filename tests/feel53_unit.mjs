import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-feel53.js"), "utf8");
const ops = fs.readFileSync(path.join(root, "src/runtime/sakurayo-ops.js"), "utf8");
const activity = fs.readFileSync(
  path.join(root, "android-app/app/src/main/java/com/sakurayo/zombietide/MainActivity.java"),
  "utf8",
);
const gradle = fs.readFileSync(path.join(root, "android-app/app/build.gradle"), "utf8");
const strings = fs.readFileSync(path.join(root, "android-app/app/src/main/res/values/strings.xml"), "utf8");
const assetFeel = fs.readFileSync(
  path.join(root, "android-app/app/src/main/assets/runtime/sakurayo-feel53.js"),
  "utf8",
);

assert.match(ops, /sakurayo-feel53\.js/);
assert.match(activity, /runtime\/sakurayo-touch54\.js/);
assert.match(activity, /runtime\/sakurayo-layout52\.js/);
assert.match(activity, /runtime\/sakurayo-feel53\.js/);
assert.match(activity, /injectRuntime/);
assert.match(activity, /setOnTouchListener/);
assert.match(activity, /__SAKURAYO_ANDROID_LANDSCAPE__/);
assert.match(activity, /androidLandscape46/);
assert.doesNotMatch(activity, /injectFeel53/);
assert.equal(assetFeel, code);
assert.match(code, /touch-action:manipulation/);
assert.match(code, /pointer-events:auto!important/);
assert.doesNotMatch(code, /update\s*=\s*function/);
assert.doesNotMatch(code, /sakurayoV3/);
assert.match(gradle, /applicationId "com\.sakurayo\.yeying\.dev"/);
assert.doesNotMatch(gradle, /applicationId "com\.sakurayo\.zombietide"/);
assert.match(gradle, /versionName "4\.6\.0-yeying"/);
assert.match(gradle, /versionCode 6105/);
assert.match(code, /chip\.textContent !== next/);
assert.match(code, /observe\(start, \{ childList: true \}/);
assert.doesNotMatch(code, /characterData: true/);
assert.match(strings, /开发版 夜樱/);

class FakeClassList {
  constructor(node) {
    this.node = node;
    this._set = new Set();
  }
  add(name) {
    this._set.add(name);
  }
  remove(name) {
    this._set.delete(name);
  }
  contains(name) {
    return this._set.has(name);
  }
  toggle(name, on) {
    if (on) this._set.add(name);
    else this._set.delete(name);
    return on;
  }
}

function el(id, tag) {
  const node = {
    id,
    tagName: (tag || "div").toUpperCase(),
    textContent: "",
    style: { setProperty() {} },
    children: [],
    parentNode: null,
    classList: null,
    querySelector(sel) {
      if (sel === ".pass53") return this.children.find((c) => c.className === "pass53") || null;
      return null;
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    insertBefore(child, _ref) {
      return this.appendChild(child);
    },
  };
  node.classList = new FakeClassList(node);
  return node;
}

const nodes = {
  homeBanner46: el("homeBanner46", "button"),
  start: el("start", "button"),
  menu: el("menu"),
  result: el("result"),
  rtitle: el("rtitle", "h2"),
  rsub: el("rsub", "p"),
  charName: el("charName", "b"),
};
nodes.charName.textContent = "月城小夜";
nodes.rtitle.textContent = "镜界节点已净化";
nodes.rsub.textContent = "鸟居挡弹不挡人 · 前二十秒会包抄。下次可以在暂停页看清短板。";

const document = {
  getElementById(id) {
    return nodes[id] || null;
  },
  querySelector(sel) {
    if (sel === ".charCard.selected") return { getAttribute: () => "sayo" };
    if (sel === "#menu .profile") return el("profile");
    if (sel === ".heroLive46") return el("heroLive46");
    return null;
  },
  createElement(tag) {
    return el("", tag);
  },
  createElementNS(_ns, tag) {
    return el("", tag);
  },
  head: el("head"),
  body: el("body"),
  documentElement: el("html"),
  readyState: "complete",
  addEventListener() {},
};

const sandbox = {
  window: {},
  document,
  setTimeout() { return 1; },
  clearTimeout() {},
  AudioContext: undefined,
};
sandbox.globalThis = sandbox;
sandbox.window.document = document;
vm.runInNewContext(code, sandbox);
const F = sandbox.window.SakurayoFeel53;

assert.equal(F.version, "4.6.0");
assert.equal(F.channel, "yeying-dev");
assert.equal(F.label, "开发版 夜樱");
assert.equal(F.ritualMs, 3000);
assert.equal(F.radioMs, 2200);

const installed = F.install();
assert.equal(installed.ok, true);
assert.equal(installed.label, "开发版 夜樱");
assert.equal(installed.reused, true);
assert.equal(F.install().reused, true);

assert.equal(F.ritualSpeak(nodes.homeBanner46, true).open, true);
assert.equal(nodes.homeBanner46.classList.contains("speak53"), true);
assert.equal(F.ritualSpeak(nodes.homeBanner46, false).open, false);
assert.equal(nodes.homeBanner46.classList.contains("speak53"), false);

const swap = F.applySwap("aya", { pluck: false });
assert.equal(swap.id, "aya");
assert.equal(swap.password, "双月");
assert.equal(swap.color, "#62eaff");
assert.equal(F.applyPassword("rion"), "黄泉");

const radio = F.startRadio(el("banter"));
assert.equal(radio.ok, true);
assert.equal(radio.ms, 2200);

assert.match(F.resultHookText(true, "anything"), /证词/);
assert.doesNotMatch(F.resultHookText(true, "anything"), /攻击|伤害|樱花币/);
assert.equal(F.resultHookText(false, "停尸车辆挡住直线弹 · 绕过去打。下一句"), "停尸车辆挡住直线弹 · 绕过去打");

const hook = F.paintResultHook(true, "ignored", nodes.result);
assert.equal(hook.ok, true);
assert.match(hook.text, /证词/);
assert.equal(hook.win, true);

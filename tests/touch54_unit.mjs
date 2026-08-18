import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-touch54.js"), "utf8");
const ops = fs.readFileSync(path.join(root, "src/runtime/sakurayo-ops.js"), "utf8");
const activity = fs.readFileSync(
  path.join(root, "android-app/app/src/main/java/com/sakurayo/zombietide/MainActivity.java"),
  "utf8",
);
const gradle = fs.readFileSync(path.join(root, "android-app/app/build.gradle"), "utf8");
const asset = fs.readFileSync(
  path.join(root, "android-app/app/src/main/assets/runtime/sakurayo-touch54.js"),
  "utf8",
);

assert.equal(asset, code);
assert.doesNotMatch(code, /update\s*=\s*function/);
assert.doesNotMatch(code, /sakurayoV3/);
assert.match(ops, /sakurayo-touch54\.js/);
assert.match(activity, /TOUCH54_ASSET/);
assert.match(activity, /setOnTouchListener/);
assert.match(gradle, /versionCode 6109/);
assert.match(code, /pointer-events:auto!important/);
assert.match(code, /elementFromPoint/);
assert.match(code, /syncCinematicHud/);
assert.doesNotMatch(code, /characterData: true/);

class FakeClassList {
  constructor() {
    this._set = new Set();
  }
  add() {
    for (const name of arguments) this._set.add(name);
  }
  remove() {
    for (const name of arguments) this._set.delete(name);
  }
  contains(name) {
    return this._set.has(name);
  }
}

function el(id, tag, className) {
  const node = {
    id,
    tagName: (tag || "div").toUpperCase(),
    className: className || "",
    disabled: false,
    clicked: 0,
    style: { pointerEvents: "" },
    children: [],
    parentNode: null,
    classList: new FakeClassList(),
    closest(sel) {
      const tokens = sel.split(",").map((s) => s.trim());
      const self = (this.id && tokens.includes("#" + this.id))
        || tokens.includes(this.tagName.toLowerCase())
        || tokens.some((t) => t.startsWith(".") && (" " + this.className + " ").includes(" " + t.slice(1) + " "));
      if (self) return this;
      return this.parentNode && this.parentNode.closest ? this.parentNode.closest(sel) : null;
    },
    click() {
      this.clicked += 1;
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
  };
  if (className) className.split(/\s+/).forEach((n) => n && node.classList.add(n));
  return node;
}

const canvas = el("cv", "canvas");
const menu = el("menu", "section");
const start = el("start", "button", "start");
menu.appendChild(start);
const nodes = { cv: canvas, menu, start, style: null };

const document = {
  getElementById(id) {
    if (id === "sakurayo-touch54-css") return nodes.style;
    return nodes[id] || null;
  },
  querySelector(sel) {
    if (sel === "canvas:not(#exploreCanvas41)") return canvas;
    if (sel.includes("#menu:not(.hidden)")) return menu.classList.contains("hidden") ? null : menu;
    return null;
  },
  createElement(tag) {
    const node = el("", tag);
    if (tag === "style") nodes.style = node;
    return node;
  },
  elementFromPoint() {
    return start;
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
  Date,
  Math,
  addEventListener() {},
  MutationObserver: class {
    observe() {}
  },
};
sandbox.globalThis = sandbox;
sandbox.window.document = document;
vm.runInNewContext(code, sandbox);
const T = sandbox.window.SakurayoTouch54;

assert.equal(T.version, "4.6.0");
const installed = T.install();
assert.equal(installed.ok, true);
assert.equal(installed.blocked, true);
assert.equal(canvas.style.pointerEvents, "none");
assert.equal(T.closestClickable(start), start);
assert.equal(T.fireClick(start).ok, true);
assert.equal(start.clicked, 1);

menu.classList.add("hidden");
const play = T.syncHits();
assert.equal(play.blocked, false);
assert.equal(canvas.style.pointerEvents, "auto");

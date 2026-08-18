import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-layout52.js"), "utf8");
const feel = fs.readFileSync(path.join(root, "src/runtime/sakurayo-feel53.js"), "utf8");
const activity = fs.readFileSync(
  path.join(root, "android-app/app/src/main/java/com/sakurayo/zombietide/MainActivity.java"),
  "utf8",
);
const gradle = fs.readFileSync(path.join(root, "android-app/app/build.gradle"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/yeying-dev-apk.yml"), "utf8");
const assetLayout = fs.readFileSync(
  path.join(root, "android-app/app/src/main/assets/runtime/sakurayo-layout52.js"),
  "utf8",
);

assert.equal(assetLayout, code);
assert.doesNotMatch(code, /update\s*=\s*function/);
assert.doesNotMatch(code, /sakurayoV3/);
assert.match(code, /touch-action:manipulation!important/);
assert.match(code, /pointer-events:auto!important/);
assert.match(code, /#menu,#menu\.homeDock46,#menu\.homeDock46 \.menu\{pointer-events:auto!important\}/);
assert.match(code, /html\.androidLandscape46 #menu\.homeDock46 \.heroLive46/);
assert.match(code, /html\.landscape46\.portraitFallback46 #menu\.homeDock46 \.homeDeck46/);
assert.match(code, /width:42%/);
assert.match(activity, /LAYOUT52_ASSET/);
assert.match(activity, /ANDROID_LANDSCAPE_SCRIPT/);
assert.match(activity, /injectRuntime/);
assert.match(gradle, /versionCode 6110/);
assert.match(gradle, /versionName "4\.7\.0-yeying"/);
assert.match(workflow, /sakurayo-layout52\.js/);
assert.match(workflow, /sakurayo-chrome\.js/);
assert.match(workflow, /cursor\/unify-v47-da3d/);
assert.match(feel, /touch-action:manipulation!important/);
assert.match(code, /position:static!important/);
assert.match(code, /homeChip46\.prism/);
assert.match(code, /hangChars\.busy/);
assert.match(code, /\.utilityButtons37\{display:none!important\}/);
assert.doesNotMatch(code, /update\s*=\s*\(/);

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

function el(id, tag) {
  const node = {
    id,
    tagName: (tag || "div").toUpperCase(),
    className: "",
    textContent: "",
    children: [],
    parentNode: null,
    classList: new FakeClassList(),
    get nextElementSibling() {
      if (!this.parentNode) return null;
      const sibs = this.parentNode.children;
      const i = sibs.indexOf(this);
      return i >= 0 ? sibs[i + 1] || null : null;
    },
    querySelector() {
      return null;
    },
    appendChild(child) {
      if (child.parentNode) {
        const i = child.parentNode.children.indexOf(child);
        if (i >= 0) child.parentNode.children.splice(i, 1);
      }
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    insertBefore(child, ref) {
      if (child.parentNode) {
        const i = child.parentNode.children.indexOf(child);
        if (i >= 0) child.parentNode.children.splice(i, 1);
      }
      child.parentNode = this;
      const at = this.children.indexOf(ref);
      if (at < 0) this.children.push(child);
      else this.children.splice(at, 0, child);
      return child;
    },
  };
  return node;
}

const html = el("html");
html.classList.add("landscape46", "portraitFallback46");
const styleHost = el("head");
const top = el("top");
const profile = el("profile");
const wallet = el("homeWallet46");
const panel = el("charSelectPanel");
const menu = el("menu");
menu.appendChild(top);
top.appendChild(profile);
top.appendChild(wallet);
menu.appendChild(panel);
const nodes = {
  homeGreet46: el("homeGreet46"),
  homeWallet46: wallet,
};

const document = {
  getElementById(id) {
    if (id === "sakurayo-layout52-css") return nodes.style || null;
    return nodes[id] || null;
  },
  querySelector(sel) {
    if (sel === "#menu .profile") return profile;
    if (sel === "#menu .top") return top;
    if (sel === "#menu .charSelectPanel") return panel;
    return null;
  },
  createElement(tag) {
    const node = el("", tag);
    if (tag === "style") nodes.style = node;
    return node;
  },
  head: styleHost,
  body: el("body"),
  documentElement: html,
  readyState: "complete",
  addEventListener() {},
};

const listeners = [];
const sandbox = {
  window: { __SAKURAYO_ANDROID_LANDSCAPE__: true },
  document,
  setTimeout(fn) {
    fn();
    return 1;
  },
  addEventListener(name, fn) {
    listeners.push([name, fn]);
  },
  MutationObserver: class {
    observe() {}
  },
};
sandbox.globalThis = sandbox;
sandbox.window.document = document;
vm.runInNewContext(code, sandbox);
const L = sandbox.window.SakurayoLayout52;

assert.equal(L.version, "4.7.0");
assert.match(L.css, /touch-action:manipulation!important/);
assert.match(L.css, /pointer-events:auto!important/);
assert.match(L.css, /position:static!important/);
assert.match(L.css, /homeChip46\.prism/);

const installed = L.install();
assert.equal(installed.ok, true);
assert.equal(installed.locked, true);
assert.equal(installed.fallback, false);
assert.equal(html.classList.contains("androidLandscape46"), true);
assert.equal(html.classList.contains("landscape46"), true);
assert.equal(html.classList.contains("portraitFallback46"), false);
assert.equal(nodes.style.textContent, L.css);
assert.equal(nodes.homeGreet46.parentNode, profile);
assert.equal(panel.parentNode, top);
assert.equal(panel.nextElementSibling, wallet);
const before = top.children.slice();
L.hangChars();
L.hangLobbyTop();
assert.deepEqual(top.children, before);

html.classList.add("portraitFallback46");
const again = L.syncAndroidLandscape();
assert.equal(again.locked, true);
assert.equal(again.fallback, false);
assert.equal(html.classList.contains("portraitFallback46"), false);

sandbox.window.__SAKURAYO_ANDROID_LANDSCAPE__ = false;
html.classList.remove("androidLandscape46");
html.classList.add("portraitFallback46");
const unlocked = L.syncAndroidLandscape();
assert.equal(unlocked.locked, false);
assert.equal(unlocked.fallback, true);
assert.equal(html.classList.contains("portraitFallback46"), true);

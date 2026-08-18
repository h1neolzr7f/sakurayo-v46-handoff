import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-chrome.js"), "utf8");
const ops = fs.readFileSync(path.join(root, "src/runtime/sakurayo-ops.js"), "utf8");
const boutique = fs.readFileSync(path.join(root, "src/runtime/sakurayo-boutique.js"), "utf8");
const activity = fs.readFileSync(
  path.join(root, "android-app/app/src/main/java/com/sakurayo/zombietide/MainActivity.java"),
  "utf8",
);
const gradle = fs.readFileSync(path.join(root, "android-app/app/build.gradle"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/yeying-dev-apk.yml"), "utf8");
const asset = fs.readFileSync(
  path.join(root, "android-app/app/src/main/assets/runtime/sakurayo-chrome.js"),
  "utf8",
);

assert.equal(asset, code);
assert.doesNotMatch(code, /update\s*=\s*function/);
assert.doesNotMatch(code, /sakurayoV3/);
assert.match(code, /SakurayoChrome/);
assert.match(code, /chromeOn46/);
assert.match(code, /testimony/);
assert.match(code, /domain/);
assert.match(code, /linearGradient/);
assert.match(ops, /sakurayo-chrome\.js/);
assert.match(boutique, /SakurayoChrome/);
assert.match(activity, /runtime\/sakurayo-chrome\.js/);
assert.match(activity, /CHROME_ASSET/);
assert.match(gradle, /versionCode 6110/);
assert.match(workflow, /sakurayo-chrome\.js/);
assert.match(workflow, /versionCode 6110/);
assert.match(code, /homeNav46/);
assert.match(code, /gacha:/);
assert.match(code, /stage:/);
assert.match(code, /archive:/);
assert.match(code, /chrome6109/);
assert.match(code, /tutorialIcon37/);
assert.match(code, /badge/);
assert.match(code, /dressChoiceFallback/);
assert.match(code, /stick:/);
assert.match(code, /ghost:/);
assert.match(code, /dress\.busy/);
assert.match(code, /data-chrome-flower/);
assert.match(code, /data-chrome-skill/);
assert.match(code, /if\(style&&style\.textContent\)return/);
assert.doesNotMatch(code, /n>40&&global\.clearInterval/);
assert.doesNotMatch(code, /update\s*=\s*function/);
console.log("PASS chrome unit");

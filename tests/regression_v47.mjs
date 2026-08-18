import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const index = read("src/index.html");
const ops = read("src/runtime/sakurayo-ops.js");
const lobby = read("src/runtime/sakurayo-lobby.js");
const layout = read("src/runtime/sakurayo-layout52.js");
const feel = read("src/runtime/sakurayo-feel53.js");
const touch = read("src/runtime/sakurayo-touch54.js");
const boutique = read("src/runtime/sakurayo-boutique.js");
const chrome = read("src/runtime/sakurayo-chrome.js");
const gradle = read("android-app/app/build.gradle");
const activity = read("android-app/app/src/main/java/com/sakurayo/zombietide/MainActivity.java");
const version = read("VERSION").trim();

assert.equal(version, "4.7.0");
assert.match(index, /SAKURAYO_GAME_VERSION = "4\.7\.0"/);
assert.match(index, /sakurayoV3/);
assert.doesNotMatch(index, /localStorage\.clear\s*\(/);
assert.doesNotMatch(index, /_update47\s*=\s*update|const _update47/);
assert.match(index, /function startGame\s*\(/);
assert.match(index, /function update\s*\(/);
assert.match(index, /function draw\s*\(/);
assert.match(index, /function spawnEnemy\s*\(/);
assert.match(index, /function showDialogue\s*\(/);
assert.match(read("src/runtime/sakurayo-cutscene.js"), /!beats\.length \|\| !!\(opts && opts\.testMode\)/);
assert.match(index, /state === "menu" && !menuUpdate\.busy/);
assert.match(index, /drawerVisible47/);
assert.match(index, /dataset\.cmd47/);
assert.match(index, /_openDrawer47/);
assert.match(index, /resize\.busy/);
assert.match(touch, /scheduleHits/);

assert.match(ops, /sakurayo-touch54\.js/);
assert.match(ops, /sakurayo-layout52\.js/);
assert.match(ops, /sakurayo-feel53\.js/);
assert.match(ops, /sakurayo-boutique\.js/);
assert.match(ops, /sakurayo-chrome\.js/);
assert.doesNotMatch(ops, /pets\.push/);
assert.doesNotMatch(ops, /update\s*=\s*function/);

assert.match(layout, /hangChars\.busy/);
assert.match(layout, /observe\(root, \{ childList: true, subtree: false \}\)/);
assert.match(layout, /utilityButtons37\{display:none!important\}/);
assert.match(layout, /position:static!important/);
assert.match(layout, /homeChip46\.prism/);
assert.match(layout, /#menu\.homeDock46 \.homeDeck46\{pointer-events:none!important\}/);
assert.match(layout, /clip-path:none/);
assert.match(feel, /@media\(max-height:430px\)\{#start \.pass53\{display:none!important\}\}/);
assert.match(index, /P\.damageSources\|\|\{\}/);
assert.match(index, /P\.damageSources = P\.damageSources \|\| \{\}/);
assert.match(layout, /touch-action:manipulation!important/);
assert.match(layout, /\.top \.charSelectPanel/);
assert.doesNotMatch(layout, /left:max\(220px/);
assert.doesNotMatch(layout, /update\s*=\s*function/);
assert.doesNotMatch(layout, /sakurayoV3/);

assert.match(lobby, /position:static!important/);
assert.match(lobby, /homeChip46\.prism/);

assert.match(feel, /applyPassword\.busy/);
assert.match(feel, /applyPassword\.pulse47/);
assert.match(feel, /startRadio\.busy/);
assert.match(feel, /banterHidden && !nowHidden/);
assert.match(feel, /observe\(start, \{ childList: true \}/);
assert.doesNotMatch(feel, /characterData: true/);
assert.doesNotMatch(feel, /update\s*=\s*function/);
assert.doesNotMatch(index, /void box\.offsetWidth/);
assert.doesNotMatch(read("src/runtime/sakurayo-cutscene.js"), /void \w+\.offsetWidth/);

assert.match(touch, /syncCinematicHud/);
assert.match(touch, /elementFromPoint/);
assert.doesNotMatch(touch, /characterData: true/);

assert.match(boutique, /if \(busy\) return/);
assert.match(boutique, /__boutique6106/);
assert.doesNotMatch(boutique, /update\s*=\s*function/);

assert.match(chrome, /chrome6109/);
assert.match(chrome, /version:"4\.7\.0"/);
assert.match(chrome, /dress\.busy/);
assert.match(chrome, /install\.done/);
assert.match(chrome, /if\(style&&style\.textContent\)return/);
assert.doesNotMatch(chrome, /documentElement\.__chromeWatch/);
assert.doesNotMatch(chrome, /n>40&&global\.clearInterval/);
assert.doesNotMatch(chrome, /update\s*=\s*function/);

assert.match(gradle, /applicationId "com\.sakurayo\.yeying\.dev"/);
assert.doesNotMatch(gradle, /applicationId "com\.sakurayo\.zombietide"/);
assert.match(gradle, /versionCode 6110/);
assert.match(gradle, /versionName "4\.7\.0-yeying"/);
assert.match(activity, /SakurayoAndroid\/4\.7\.0-yeying/);
assert.match(activity, /CHROME_ASSET/);
assert.match(activity, /__SAKURAYO_ANDROID_LANDSCAPE__/);

assert.equal(read("android-app/app/src/main/assets/runtime/sakurayo-layout52.js"), layout);
assert.equal(read("android-app/app/src/main/assets/runtime/sakurayo-feel53.js"), feel);
assert.equal(read("android-app/app/src/main/assets/runtime/sakurayo-touch54.js"), touch);
assert.equal(read("android-app/app/src/main/assets/runtime/sakurayo-boutique.js"), boutique);
assert.equal(read("android-app/app/src/main/assets/runtime/sakurayo-chrome.js"), chrome);

console.log("PASS regression v47");

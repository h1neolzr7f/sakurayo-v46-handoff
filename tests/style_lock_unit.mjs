import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const index = read("src/index.html");
const lobby = read("src/runtime/sakurayo-lobby.js");
const shell = read("src/runtime/sakurayo-shell.js");
const live = read("src/runtime/sakurayo-live.js");
const layout = read("src/runtime/sakurayo-layout52.js");
const boutique = read("src/runtime/sakurayo-boutique.js");
const chrome = read("src/runtime/sakurayo-chrome.js");
const all = [index, lobby, shell, live, layout, boutique, chrome].join("\n");

assert.doesNotMatch(all, /min\(62vw,680px\)/);
assert.doesNotMatch(all, /min\(64vw,760px\)/);
assert.doesNotMatch(all, /min\(46vw,460px\)/);
assert.match(lobby, /#menu\.homeDock46 \.heroLiveBreath46\{width:100%;height:100%\}/);
assert.match(layout, /heroLiveBreath46\{width:100%;height:100%\}/);

assert.doesNotMatch(all, /#shopDrawer \.skinPreview\{[^}]*height:132px/);
assert.doesNotMatch(all, /#shopFeatured46 \.shopSkinPrev46\{[^}]*height:120px/);
assert.doesNotMatch(all, /#shopDrawer \.shopGoodIco46\{height:120px/);
assert.match(lobby, /#shopDrawer \.skinPreview\{width:100%;height:88px/);
assert.match(shell, /#shopDrawer \.skinPreview\{width:100%;height:88px/);
assert.match(boutique, /#shopDrawer \.skinPreview\{position:relative;height:88px/);
assert.match(index, /#shopDrawer \.skinPreview\{height:88px\}/);
assert.match(index, /\.shopIcon40\{width:64px;height:64px/);
assert.match(chrome, /#shopDrawer \.shopIcon40\{width:64px;height:64px;min-width:64px;min-height:64px/);

assert.doesNotMatch(lobby, /homeRail46 button i\{display:block;position:relative;width:16px/);
assert.match(lobby, /homeRail46 button i\{display:block;position:relative;width:22px;height:22px/);
assert.match(shell, /\.railIco46\{display:grid;place-items:center;width:22px;height:22px/);
assert.match(chrome, /\.railIco46\.chromeOn46\{width:22px;height:22px/);
assert.match(chrome, /\.shellItem46>i\.chromeOn46\{width:42px;height:42px/);
assert.doesNotMatch(chrome, /\.shellItem46>i\.chromeOn46\{width:22px;height:22px\}/);

assert.match(shell, /homeModes46 \.modeIco46\{display:block;width:22px;height:22px/);
assert.match(chrome, /\.modeIco46\.chromeOn46\{[^}]*width:22px;height:22px/);
assert.match(lobby, /\.homeNav46 button span\{display:grid;place-items:center;width:24px;height:24px/);
assert.match(lobby, /html\.landscape46 \.rosterArt46\{height:118px\}/);
assert.match(shell, /\.rosterArt46\{height:118px\}/);
assert.match(boutique, /\.shopRail46 button\{[^}]*min-height:44px/);
assert.match(shell, /\.shopRail46 button\{min-height:44px/);
assert.doesNotMatch(boutique, /\.shopRail46 button\{[^}]*min-height:58px/);

assert.match(lobby, /homeBanner46\{display:grid;.*width:50px;min-height:48px/);
assert.match(shell, /homeBanner46\{grid-template-columns:1fr;width:50px;min-height:48px/);
assert.match(layout, /homeBanner46\{[^}]*width:50px!important;min-height:48px!important/);
assert.doesNotMatch(shell, /homeBanner46\{[^}]*min\(248px/);
assert.doesNotMatch(lobby, /wishHero46\{[^}]*width:58%/);
assert.match(lobby, /html\.landscape46 \.wishHero46\{left:-4%;width:52%;height:142%/);

assert.match(index, /__SAKURAYO_ANDROID_LANDSCAPE__/);
assert.match(index, /script src="runtime\/sakurayo-chrome\.js"/);
assert.match(index, /script src="runtime\/sakurayo-boutique\.js"/);
assert.match(chrome, /talismanIco/);
assert.match(chrome, /tmech:function/);
assert.match(chrome, /tnecro:function/);
assert.match(index, /data-shop-ico=/);
assert.match(index, /"","t"\+id\)/);
assert.match(lobby, /#000 94%/);
assert.match(layout, /object-position:center 10%/);
assert.match(lobby, /wishPower46/);
assert.match(lobby, /单次叠伤/);
assert.match(shell, /coins: 25000, shard: 800, prism: 500, ticket: 80/);
assert.match(shell, /icoKind = m\.id === "betaCrate" \? "gift" : "mail"/);

console.log("PASS style lock unit");

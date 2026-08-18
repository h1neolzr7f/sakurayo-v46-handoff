import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");

assert.match(html, /id="mgHero46"|mgHero46/);
assert.match(html, /classList\.add\("mgHall46"\)/);
assert.match(html, /MAIN_GOD_BOSS_TYPES46=/);
assert.match(html, /function tickMainGodBoss46/);
assert.match(html, /function drawMainGodBossFx46/);
assert.match(html, /function applyMainGodExtras46/);
assert.match(html, /function hurtMainGodFx46/);
assert.match(html, /function extraOverlapHint46/);
assert.match(html, /function drawFxStampAt46/);
assert.match(html, /function forceMainGodBossType46/);
assert.match(html, /function currentMainGodBossType46/);
assert.match(html, /directionalSlash36=function/);
assert.match(html, /isMainGodRun36\(\)&&P\.mgBoss\?\.type==="mirror"/);
assert.match(html, /group:"保命防护"/);
assert.match(html, /枪弹或斩击/);
assert.match(html, /\["保命防护","保命"\]/);
assert.match(html, /P\.mgEcho/);
assert.match(html, /P\.mgVoidFlash/);
assert.match(html, /combat:after-update".*tickMainGodBoss46|tickMainGodBoss46\(payload/);
assert.doesNotMatch(html, /n:"爆炸"/);
assert.doesNotMatch(html, /T病毒|血族子爵|亡灵圣经|太阳真经|审判之矛|重生十字章|纳戒/);

const catalog = html.match(/const MAIN_GOD_ITEMS36=\{([\s\S]*?)\n  \};/);
assert.ok(catalog, "MAIN_GOD_ITEMS36 字面量应保持 14 项");
assert.equal([...catalog[1].matchAll(/^\s+\w+:\{n:/gm)].length, 14);
assert.equal([...html.matchAll(/MAIN_GOD_ITEMS36\.\w+=\{n:/g)].length, 9);

console.log("maingod_polish_unit: ok");

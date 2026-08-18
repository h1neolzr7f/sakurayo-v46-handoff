import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");

const TEMPLATES = [
  ["mecha", "机甲契约", "mech"],
  ["crimson", "猩红血统", "vamp"],
  ["qi", "气机内力", "cult"],
  ["star", "星辉弹幕", "magical"],
  ["titan", "基因巨兽", "gene"],
];
const LOCKS = [
  ["lockSurvive", "生存本能"],
  ["lockControl", "零时差控制"],
  ["lockSpecial", "潜能特化"],
];

for (const [id, name, school] of TEMPLATES) {
  assert.match(html, new RegExp(`${id}:\\{n:"${name}"`));
  assert.match(html, new RegExp(`${id}:\\{n:"${name}"[^\\n]+school:"${school}"`));
}
for (const [id, name] of LOCKS) {
  assert.match(html, new RegExp(`${id}:\\{n:"${name}"`));
}

assert.match(html, /const MAIN_GOD_CORE_DEF46=/);
assert.match(html, /function buyMainGodTemplate46/);
assert.match(html, /function buyMainGodLock46/);
assert.match(html, /function applyMainGodCore46/);
assert.match(html, /function grantCoreShards46/);
assert.match(html, /P\.mgBurst/);
assert.match(html, /心核激荡/);
assert.match(html, /念丝偏转|P\.mgDeflect/);
assert.match(html, /id="soulHud46"|soulHud46/);
assert.match(html, /buyMainGodTemplate46\(id\)/);
assert.match(html, /grantMainGodShards46/);

assert.doesNotMatch(html, /n:"爆炸"/);
assert.doesNotMatch(html, /T病毒|血族子爵|亡灵圣经|太阳真经|审判之矛|重生十字章|纳戒/);
assert.match(html, /货架不出现「爆炸」|不单独出售「爆炸」/);
assert.match(html, /function pickMainGodBossType46/);
assert.match(html, /监察投影·校验者/);
assert.match(html, /收割投影·断线者/);
assert.match(html, /镜像投影·抄袭者/);
assert.match(html, /深廊投影·压境者/);
assert.match(html, /mgHall46/);
assert.match(html, /mgHero46/);
assert.match(html, /spawnBossAdds=function\(type,count,guard\)\{if\(isMainGodRun36\(\)\)return 0/);
assert.match(html, /isMainGodRun36\(\)&&P\.mgBoss\?\.type==="mirror"/);
assert.match(html, /function hurtMainGodFx46/);
assert.match(html, /group:"保命防护"/);

const catalog = html.match(/const MAIN_GOD_ITEMS36=\{([\s\S]*?)\n  \};/);
assert.ok(catalog, "MAIN_GOD_ITEMS36 应可解析");
assert.equal([...catalog[1].matchAll(/^\s+\w+:\{n:/gm)].length, 14);

console.log("maingod_core_unit: ok");

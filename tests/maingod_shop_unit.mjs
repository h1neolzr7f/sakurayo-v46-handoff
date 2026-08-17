import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");

const NEW_ITEMS = [
  ["geneLock", "本能解锁序列", "血统与灵能"],
  ["bioSerum", "镜核原液变异", "血统与灵能"],
  ["deathSense", "零时差感应环", "血统与灵能"],
  ["captainMark", "轮回队长印", "职业与技法"],
  ["wardWeave", "监管防弹织层", "特殊效果道具"],
  ["judgmentPin", "裁决投针", "特殊效果道具"],
];

for (const [id, name, group] of NEW_ITEMS) {
  assert.match(html, new RegExp(`${id}:\\{n:"${name}"`));
  assert.match(html, new RegExp(`${id}:\\{n:"${name}"[^\\n]+group:"${group}"`));
  assert.match(html, new RegExp(`${id}: 0`));
  assert.match(html, new RegExp(`${id}:0`));
}

assert.match(html, /P\.mgGeneLock && P\.hp \/ Math\.max\(1, P\.maxHp\) < 0\.4/);
assert.match(html, /m\.judgmentPin\)P\.bossPierce/);
assert.match(html, /m\.wardWeave\)P\.lordRisk/);
assert.match(html, /captainMark\|\|0\)\*2/);
assert.match(html, /P\.mgDeathSense\|\|0\)\*18/);
assert.doesNotMatch(html, /T病毒|血族子爵|亡灵圣经|太阳真经|审判之矛|重生十字章|纳戒/);

const catalog = html.match(/const MAIN_GOD_ITEMS36=\{([\s\S]*?)\n  \};/);
assert.ok(catalog, "MAIN_GOD_ITEMS36 应可解析");
assert.equal([...catalog[1].matchAll(/^\s+\w+:\{n:/gm)].length, 14);
assert.match(html, /MAIN_GOD_ITEMS36\.cursedHeart=/);

console.log("maingod_shop_unit: ok");

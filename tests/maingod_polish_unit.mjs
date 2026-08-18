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
assert.match(html, /function drawMainGodArtAt46/);
assert.match(html, /function preloadMainGodArt46/);
assert.match(html, /function dressMainGodIcon46/);
assert.match(html, /MAIN_GOD_ART_ROOT46="content-packs\/maingod-void"/);
assert.match(html, /\$\{MAIN_GOD_ART_ROOT46\}\/fx\/pillar\.webp/);
assert.match(html, /\$\{MAIN_GOD_ART_ROOT46\}\/fx\/rift\.webp/);
assert.match(html, /\$\{MAIN_GOD_ART_ROOT46\}\/fx\/mirror\.webp/);
assert.match(html, /\$\{MAIN_GOD_ART_ROOT46\}\/fx\/ward\.webp/);
assert.match(html, /\$\{MAIN_GOD_ART_ROOT46\}\/ui\/hall\.webp/);
assert.match(html, /下次监察/);

const artRoot = path.join(root, "android-app/app/src/main/assets/game/art/content-packs/maingod-void");
for (const rel of [
  "fx/pillar.webp",
  "fx/rift.webp",
  "fx/mirror.webp",
  "fx/ward.webp",
  "ui/hall.webp",
  "ui/emblem_auditor.webp",
  "ui/emblem_reaper.webp",
  "ui/emblem_mirror.webp",
  "ui/emblem_warden.webp",
  "ui/tpl_mecha.webp",
  "ui/tpl_crimson.webp",
  "ui/tpl_qi.webp",
  "ui/tpl_star.webp",
  "ui/tpl_titan.webp",
  "ui/icon_lock.webp",
]) {
  const file = path.join(artRoot, rel);
  assert.ok(fs.existsSync(file), `missing ${rel}`);
  assert.ok(fs.statSync(file).size > 8000, `${rel} too small`);
}
assert.match(html, /function forceMainGodBossType46/);
assert.match(html, /function currentMainGodBossType46/);
assert.match(html, /directionalSlash36=function/);
assert.match(html, /source==="orbit"/);
assert.match(html, /old&&old\.hp<=0&&\(n\.kind==="pillar"\|\|n\.kind==="mirror"\)/);
assert.match(html, /bossPhaseDialogue=function/);
assert.match(html, /isMainGodRun36\(\)&&P\.mgBoss\?\.type==="mirror"/);
assert.match(html, /group:"保命防护"/);
assert.match(html, /枪弹或斩击/);
assert.match(html, /\["保命防护","保命"\]/);
assert.match(html, /flex-wrap/);
assert.match(html, /P\.mgBossForce46=null/);
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

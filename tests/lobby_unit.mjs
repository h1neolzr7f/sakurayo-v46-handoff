import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8");
const sandbox = { window: {}, document: null, Math, Date, Object, Array, Number, String };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const L = sandbox.window.SakurayoLobby;

assert.equal(code.includes("#rotateHint46"), false, "lobby 不得再写横持提示");
assert.equal(code.includes("portraitFallback46"), false, "lobby 不得再写竖版回退");
const indexSrc = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
assert.equal(indexSrc.includes('hint.textContent = "请横持设备"'), false, "index 不得再创建横持提示");
assert.equal(indexSrc.includes('toggle("portraitFallback46"'), false, "index 不得再打开竖版回退");
assert.equal(L.version, "4.6.0");
assert.equal(L.CARDS.length, 8);
assert.equal(L.CHRONICLE.length, 5);
assert.equal(L.CHRONICLE[0].n, "第零次死亡");
assert.equal(L.CHRONICLE[4].n, "镜零之后");
assert.equal(L.SCHOOL_CARDS.length, 14);
assert.equal([...L.SCHOOL_CARDS].filter((card) => card.r === "SR").map((card) => card.id).sort().join(","), "school_cult,school_gun,school_shrine");
assert.ok(L.SCHOOL_CARDS.every((card) => card.kind === "school" && Array.isArray(card.lore) && card.lore.length === 4));
assert.deepEqual([...L.DEFAULT_SHOWN], ["sayo_echo", "aya_petal"]);
assert.deepEqual([...L.POOL_IDS], ["remnant", "fashion", "weapon"]);
assert.equal(L.JOB_CARDS.length, 28);
assert.ok(L.JOB_CARDS.every((card) => card.r === "SR" && card.kind === "job" && card.dmg === 0.005 && Array.isArray(card.lore) && card.lore.length === 4));
assert.ok(L.JOB_CARDS.every((card) => card.lore.every((line) => [...line].filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length > 8)));
assert.equal(L.FUSION_CARDS.length, 24);
assert.ok(L.FUSION_CARDS.every((card) => card.r === "SSR" && card.kind === "fusion" && card.dmg === 0.008 && Array.isArray(card.pair) && card.pair.length === 2 && Array.isArray(card.lore) && card.lore.length === 4));
assert.ok(L.FUSION_CARDS.every((card) => card.id.startsWith("fusion_") && card.lore.every((line) => [...line].filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length > 8)));
assert.equal(
  L.FUSION_CARDS.map((card) => card.id).join(","),
  "fusion_magitech,fusion_gunshrine,fusion_bloodstar,fusion_bloodmech,fusion_idolgun,fusion_thunderpriest,fusion_plagueidol,fusion_railsword,fusion_flowerplague,fusion_fleshshrine,fusion_shadowmage,fusion_bloodmage,fusion_nanoninja,fusion_shadowblade,fusion_plagueforge,fusion_biogun,fusion_bloodsword,fusion_chimera,fusion_corpseimmortal,fusion_shikigami,fusion_necrospore,fusion_bloodbeast,fusion_elementalbeast,fusion_soulgun"
);
assert.equal(L.FUSION_CARDS.filter((card) => card.face === "sayo").length, 10);
assert.equal(L.FUSION_CARDS.filter((card) => card.face === "aya").length, 6);
assert.equal(L.FUSION_CARDS.filter((card) => card.face === "rion").length, 8);
assert.deepEqual([...L.ROSTER_TABS], ["scrap", "school", "job", "fusion", "fashion", "weapon"]);
assert.equal(L.FASHION_CARDS.length, 12);
assert.equal(L.WEAPON_CARDS.length, 12);
assert.ok(L.FASHION_CARDS.filter((card) => card.legend).map((card) => card.id).join(",").includes("fashion_sayo_crown"));
assert.ok(L.WEAPON_CARDS.filter((card) => card.legend).map((card) => card.id).join(",").includes("weapon_sayo_final"));
assert.equal(L.cardOf("fashion_sayo_crown").n, "终夜樱冠");
assert.equal(L.cardOf("fashion_aya_funeral").n, "零号葬仪");
assert.equal(L.cardOf("fashion_rion_bride").n, "黄泉花嫁");
assert.equal(L.cardOf("weapon_sayo_final").n, "夜樱终弹");
assert.equal(L.cardOf("weapon_aya_mirror").n, "月切·镜反");
assert.equal(L.cardOf("weapon_rion_burial").n, "黑羽葬");
function hanziCount(line) {
  return [...line].filter((ch) => /[\u4e00-\u9fff]/.test(ch)).length;
}
assert.ok([...L.FASHION_CARDS, ...L.WEAPON_CARDS].every((card) => Array.isArray(card.lore) && card.lore.length === 4));
assert.ok([...L.FASHION_CARDS, ...L.WEAPON_CARDS].every((card) => card.lore.every((line) => hanziCount(line) > 8)));
const collageIds = [
  "fashion_sayo_plain","fashion_sayo_neon","fashion_sayo_night",
  "fashion_aya_suit","fashion_aya_coat","fashion_aya_veil",
  "fashion_rion_keiko","fashion_rion_haori","fashion_rion_bloom",
  "weapon_sayo_spare","weapon_sayo_petal","weapon_aya_side","weapon_aya_twin",
  "weapon_rion_wood","weapon_rion_under","weapon_mirror_round","weapon_shard_blade","weapon_radio_bat",
];
function gachaArt(id) {
  return path.join(root, "android-app/app/src/main/assets/game/art/gacha", id + ".webp");
}
function artHash(id) {
  return createHash("sha256").update(fs.readFileSync(gachaArt(id))).digest("hex");
}
collageIds.forEach((id) => {
  assert.equal(fs.existsSync(gachaArt(id)), true, "missing " + id);
  assert.ok(fs.statSync(gachaArt(id)).size > 8000, id + " too small");
});
assert.notEqual(artHash("fashion_sayo_neon"), artHash("weapon_radio_bat"), "霓虹不得再等于电台短棍");
assert.notEqual(artHash("fashion_rion_keiko"), artHash("weapon_rion_wood"), "稽古不得再等于无铭木刀");
assert.equal(new Set(collageIds.map(artHash)).size, collageIds.length, "18 张必须互不相同");
const keepHashes = {
  fashion_sayo_crown: "b313dd1872cdf4793d138d5c8d9490d8357a9348ace5b3deb3c656f039a1484f",
  fashion_aya_funeral: "5d07014661d7d90ec4cd6febf944a3b2538c6e5dc5c08e6829ae747cabb9cdea",
  fashion_rion_bride: "abf79d5ae6e1ce299dda578bf6c88d80580fe85b18f1e3c5c899e3dde28e03f1",
  weapon_sayo_final: "8f8b58bb150a2253b94e2dca43d0bfe4a2f96ebe5fbfdb8907060632729a7e38",
  weapon_aya_mirror: "04c2bc41f4d71aa9691735de6e04937488b3fed3715910ff4de03d3f86ff75dc",
  weapon_rion_burial: "544626968de7ff0f184e186370a26839ffd0908c3c655ed5cdb8771a354b20d5",
  sayo_echo: "a1f99f31bf5c4c2e8059cde650dc40cd0d9ef97533aabb2c0f3e62f6ce614409",
  school_shrine: "3f3c6a3ce029e954b916b18cc3d1d55bdfe7283f8a1111d330cb3fc8b6131abc",
  job_garden: "3970b76d407c313c22b49efacd7ef9b62b2ca7da376f5c0376f877fa15220a6c",
  fusion_shadowmage: "330ee35b19708ed7a422fdcf50009e019903e200f74f5d48b33e82a80a0061f6",
};
Object.entries(keepHashes).forEach(([id, sha]) => {
  assert.equal(artHash(id), sha, id + " hash changed");
});
assert.equal(L.RATES.single, 160);
assert.equal(L.RATES.ten, 1440);
assert.equal(L.RATES.SSR, 0.01);
assert.equal(L.RATES.pitySSR, 80);
assert.equal(L.RATES.softPity, 65);
assert.equal(L.RATES.spark, 200);
assert.ok(L.CARDS.every((card) => card.r === "R" && card.kind === "scrap"));
assert.ok(L.CARDS.every((card) => Array.isArray(card.lore) && card.lore.length === 4));
assert.equal(L.cardOf("last_witness").n, "碎镜后的人");
assert.match(L.cardOf("last_witness").lore[0], /他不是小夜/);
["school_shrine","school_idol","school_magical","school_mech","school_spore","school_gun","school_mage","school_alch","school_ninja","school_vamp","school_cult","school_necro","school_gene","school_summon","job_swarm","job_railLord","job_hive","job_garden","job_starIdol","job_miracle","job_exorcist","job_guardian","job_warSinger","job_healingIdol","job_barrage","job_sniper","job_plagueDoctor","job_philosopher","job_bloodDuke","job_batQueen","job_element","job_timeMage","job_shadow","job_bombNinja","job_swordSaint","job_thunderLord","job_titan","job_berserk","job_beast","job_heroic","job_boneKing","job_soulHerd","fusion_magitech","fusion_gunshrine","fusion_bloodstar","fusion_bloodmech","fusion_idolgun","fusion_thunderpriest","fusion_plagueidol","fusion_railsword","fusion_flowerplague","fusion_fleshshrine","fusion_shadowmage","fusion_bloodmage","fusion_nanoninja","fusion_shadowblade","fusion_plagueforge","fusion_biogun","fusion_bloodsword","fusion_chimera","fusion_corpseimmortal","fusion_shikigami","fusion_necrospore","fusion_bloodbeast","fusion_elementalbeast","fusion_soulgun","fashion_sayo_crown","fashion_aya_funeral","fashion_rion_bride","fashion_sayo_plain","weapon_sayo_final","weapon_aya_mirror","weapon_rion_burial","weapon_sayo_spare"].forEach((id) => {
  const art = path.join(root, "android-app/app/src/main/assets/game/art/gacha", id + ".webp");
  assert.equal(fs.existsSync(art), true, "missing " + id);
  assert.ok(fs.statSync(art).size > 8000, id + " too small");
});
["sayo_echo","aya_petal","rion_edge","night_radio","shrine_seal","void_ticket","cherry_crown","last_witness","banner_bg","card_back","hero_sayo","hero_aya","hero_rion"].forEach((id) => {
  assert.equal(fs.existsSync(path.join(root, "android-app/app/src/main/assets/game/art/gacha", id + ".webp")), true);
});

const fresh = { coins: 90, shop40: {} };
const shop = L.normalizeOps(fresh.shop40);
fresh.shop40 = shop;
assert.equal(shop.ops.owned.sayo_echo, 1);
assert.equal(shop.ops.owned.aya_petal, 1);
assert.equal(shop.ops.owned.last_witness, 0);
assert.equal(shop.ops.pool, "remnant");
assert.equal(typeof shop.ops.shards, "number");
assert.ok(shop.ops.fashion && typeof shop.ops.fashion.pity === "number");
assert.ok(shop.ops.weapon && typeof shop.ops.weapon.pity === "number");
assert.equal(L.snapshot(fresh).shown.includes("sayo_echo"), true);
assert.deepEqual([...L.snapshot(fresh).pages], ["remnant", "fashion", "weapon"]);

const old = { coins: 90, shop40: { ops: { pity: 17, owned: { sayo_echo: 2 } } } };
const migrated = L.normalizeOps(old.shop40);
old.shop40 = migrated;
assert.equal(migrated.ops.pity, 17);
assert.equal(migrated.ops.owned.sayo_echo, 2);
assert.equal(migrated.ops.owned.aya_petal, 0);
assert.equal(migrated.ops.rosterTab, "scrap");
assert.equal(migrated.ops.owned.job_swarm, 0);
assert.equal(migrated.ops.owned.fusion_magitech, 0);
assert.equal(migrated.ops.owned.fusion_soulgun, 0);
const oldJobTab = { coins: 90, shop40: { ops: { rosterTab: "job", owned: { sayo_echo: 1 } } } };
assert.equal(L.normalizeOps(oldJobTab.shop40).ops.rosterTab, "job");
assert.equal(L.normalizeOps({ ops: { rosterTab: "unknown" } }).ops.rosterTab, "scrap");

const poor = { coins: 10, shop40: L.normalizeOps({}) };
const denied = L.pull(poor, 1, () => 0);
assert.equal(denied.ok, false);
assert.equal(denied.reason, "coins");
assert.equal(poor.coins, 10);

const rich = { coins: 20000, shop40: L.normalizeOps({}) };
const one = L.pull(rich, 1, () => 0.999);
assert.equal(one.ok, true);
assert.equal(one.results.length, 1);
assert.equal(rich.coins, 20000 - 160);
assert.equal(rich.shop40.ops.pulls, 1);

const ten = L.pull(rich, 10, () => 0.5);
assert.equal(ten.ok, true);
assert.equal(ten.results.length, 10);
assert.equal(rich.shop40.ops.tenPulls, 1);
assert.equal(rich.coins, 20000 - 160 - 1440);

const pitySave = { coins: 20000, shop40: L.normalizeOps({}) };
pitySave.shop40.ops.pity = 79;
const forced = L.pull(pitySave, 1, () => 0.999);
assert.equal(forced.results[0].r, "SSR");
assert.equal(forced.results[0].kind, "fusion", "硬保必须落在融合 SSR，不是残件/转职/基础");
assert.ok(String(forced.results[0].id).startsWith("fusion_"));
assert.notEqual(forced.results[0].kind, "scrap");
assert.notEqual(forced.results[0].kind, "job");
assert.notEqual(forced.results[0].kind, "school");
assert.equal(pitySave.shop40.ops.pity, 0, "残片 SSR 保底履约后必须清 pity");
const afterPity = L.pull(pitySave, 1, () => 0.99);
assert.equal(afterPity.ok, true);
assert.equal(afterPity.results[0].r, "R");

const remnantPool = [...L.CARDS, ...L.SCHOOL_CARDS, ...L.JOB_CARDS, ...L.FUSION_CARDS];
assert.equal(L.downgradeRarity("N", remnantPool), "R");
assert.equal(L.downgradeRarity("R", remnantPool), "R");
assert.equal(L.downgradeRarity("SR", remnantPool), "SR");
assert.equal(L.downgradeRarity("SSR", remnantPool), "SSR");
const nMiss = { coins: 20000, shop40: L.normalizeOps({}) };
const nHit = L.pull(nMiss, 1, () => 0.99);
assert.equal(nHit.ok, true);
assert.equal(nHit.results[0].r, "R");

function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function tallyPulls(pool, n, seed) {
  const save = { coins: n * 160 + 160, shop40: L.normalizeOps({}) };
  const rng = lcg(seed);
  const tally = { N: 0, R: 0, SR: 0, SSR: 0 };
  for (let i = 0; i < n; i++) {
    const row = L.pull(save, 1, rng, pool);
    assert.equal(row.ok, true, pool + " pull " + i);
    tally[row.results[0].r] += 1;
  }
  return tally;
}
function tallyRemnantJobs(n, seed) {
  const save = { coins: n * 160 + 160, shop40: L.normalizeOps({}) };
  const rng = lcg(seed);
  const tally = { N: 0, R: 0, SR: 0, SSR: 0 };
  const jobs = new Set();
  const fusions = new Set();
  for (let i = 0; i < n; i++) {
    const row = L.pull(save, 1, rng, "remnant");
    tally[row.results[0].r] += 1;
    if (String(row.results[0].id).startsWith("job_")) jobs.add(row.results[0].id);
    if (String(row.results[0].id).startsWith("fusion_")) fusions.add(row.results[0].id);
  }
  return { tally, jobs, fusions };
}
function assertRemnantSpread(pack, label) {
  const remnantTally = pack.tally;
  assert.ok(remnantTally.R > remnantTally.SR * 3, label + " R 应远多于 SR: " + JSON.stringify(remnantTally));
  assert.ok(remnantTally.R / 2000 >= 0.55, label + " 约六七成应为 R: " + JSON.stringify(remnantTally));
  assert.ok(remnantTally.SR / 2000 >= 0.04 && remnantTally.SR / 2000 <= 0.25, label + " SR 应在一成左右: " + JSON.stringify(remnantTally));
  assert.ok(remnantTally.SSR > 0, label + " SSR 不能再是 0: " + JSON.stringify(remnantTally));
  assert.ok(remnantTally.SSR / 2000 >= 0.01 && remnantTally.SSR / 2000 <= 0.08, label + " SSR 应在 1%～8%: " + JSON.stringify(remnantTally));
  assert.ok(remnantTally.SR / 2000 < 0.5, label + " 不能再出现过半 SR");
  assert.ok(pack.jobs.size >= 10, label + " 至少 10 个不同 job_*: " + pack.jobs.size);
  assert.ok(pack.fusions.size >= 8, label + " 至少 8 个不同 fusion_*: " + pack.fusions.size);
}
const remnantPack = tallyRemnantJobs(2000, 0x51c0de);
assertRemnantSpread(remnantPack, "0x51c0de");
assertRemnantSpread(tallyRemnantJobs(2000, 0x12345678), "0x12345678");
assertRemnantSpread(tallyRemnantJobs(2000, 0xabcdef01), "0xabcdef01");
const fashionTally = tallyPulls("fashion", 2000, 0x51c0de);
assert.ok(fashionTally.N > fashionTally.SR, "时装 N 应多于 SR: " + JSON.stringify(fashionTally));
assert.ok(fashionTally.N / 2000 >= 0.5, "时装 N 应保持现有量级: " + JSON.stringify(fashionTally));
const weaponTally = tallyPulls("weapon", 2000, 0x51c0de);
assert.ok(weaponTally.N > weaponTally.SR, "武器 N 应多于 SR: " + JSON.stringify(weaponTally));
assert.ok(weaponTally.N / 2000 >= 0.5, "武器 N 应保持现有量级: " + JSON.stringify(weaponTally));

const fashionSave = { coins: 20000, shop40: L.normalizeOps({}) };
const fashionPull = L.pull(fashionSave, 1, () => 0.5, "fashion");
assert.equal(fashionPull.ok, true);
assert.equal(fashionPull.pool, "fashion");
assert.equal(fashionSave.coins, 20000 - 160);
assert.ok(fashionPull.results[0].id.startsWith("fashion_"));
const scrapSpark = L.spark({ coins: 0, shop40: L.normalizeOps({}) }, "remnant", "sayo_echo");
assert.equal(scrapSpark.ok, false);
assert.equal(scrapSpark.reason, "scrap");
const jobSpark = L.spark({ coins: 0, shop40: L.normalizeOps({ ops: { shards: 200 } }) }, "remnant", "job_swarm");
assert.equal(jobSpark.ok, false);
assert.equal(jobSpark.reason, "rarity");
const fusionSpark = L.spark({ coins: 0, shop40: L.normalizeOps({ ops: { shards: 200 } }) }, "remnant", "fusion_magitech");
assert.equal(fusionSpark.ok, true);
assert.equal(fusionSpark.id, "fusion_magitech");
const fusionSparkAgain = L.spark({ coins: 0, shop40: L.normalizeOps({ ops: { shards: 200, owned: { fusion_magitech: 1 } } }) }, "remnant", "fusion_magitech");
assert.equal(fusionSparkAgain.ok, false);
fashionSave.shop40.ops.fashion.shards = 200;
const sparked = L.spark(fashionSave, "fashion", "fashion_sayo_crown");
assert.equal(sparked.ok, true);
assert.equal(fashionSave.shop40.ops.fashion.owned.fashion_sayo_crown, 1);
assert.equal(fashionSave.shop40.ops.fashion.shards, 0);
const equipped = L.equip(fashionSave, "fashion", "fashion_sayo_crown");
assert.equal(equipped.ok, true);
const wearP = { dmg: 20, character: "sayo" };
L.applyOwnedBonus(wearP, { character: "sayo", shop40: fashionSave.shop40 });
assert.ok(Math.abs(wearP.dmg - 20 * 1.08) < 1e-6);

const bonusP = { crit: 0.05, spd: 220, dmg: 18, bladePower: 1, skillCd: 7, damageReduce: 0, maxSh: 0, sh: 0, maxHp: 100, hp: 100, character: "sayo" };
const bonusSave = { character: "sayo", shop40: L.normalizeOps({}) };
bonusSave.shop40.ops.owned.sayo_echo = 1;
bonusSave.shop40.ops.owned.cherry_crown = 1;
L.applyOwnedBonus(bonusP, bonusSave);
assert.ok(Math.abs(bonusP.crit - 0.055) < 1e-9);
assert.ok(Math.abs(bonusP.dmg - 18 * 1.008) < 1e-6);

const allBonusP = { crit: 0.05, spd: 200, dmg: 20, bladePower: 1, skillCd: 10, damageReduce: 0, maxSh: 0, sh: 0, maxHp: 100, hp: 80, character: "rion" };
const allBonusSave = { character: "rion", shop40: L.normalizeOps({}) };
L.CARDS.forEach((card) => { allBonusSave.shop40.ops.owned[card.id] = 2; });
L.applyOwnedBonus(allBonusP, allBonusSave);
assert.ok(Math.abs(allBonusP.crit - 0.055) < 1e-9);
assert.ok(Math.abs(allBonusP.spd - 200 * 1.005) < 1e-6);
assert.ok(Math.abs(allBonusP.bladePower - 1.01) < 1e-9);
assert.ok(Math.abs(allBonusP.skillCd - 10 * 0.995) < 1e-6);
assert.ok(Math.abs(allBonusP.damageReduce - 0.004) < 1e-9);
assert.equal(allBonusP.maxSh, 4);
assert.equal(allBonusP.sh, 4);
assert.ok(Math.abs(allBonusP.dmg - 20 * 1.01 * 1.008) < 1e-6);
assert.ok(Math.abs(allBonusP.maxHp - 101) < 1e-6);
assert.equal(allBonusP.hp, allBonusP.maxHp);

const schoolP = { dmg: 20 };
const schoolSave = { shop40: L.normalizeOps({}) };
L.SCHOOL_CARDS.slice(0, 7).forEach((card) => { schoolSave.shop40.ops.owned[card.id] = 1; });
L.applyOwnedBonus(schoolP, schoolSave);
const sevenMul = L.SCHOOL_CARDS.slice(0, 7).reduce((m, card) => m * (1 + card.dmg), 1) * 1.02;
assert.ok(Math.abs(schoolP.dmg - 20 * sevenMul) < 1e-6);
assert.equal(L.hasSchool(schoolSave, "shrine"), true);
assert.equal(L.hasSchool(schoolSave, "summon"), false);
L.SCHOOL_CARDS.forEach((card) => { schoolSave.shop40.ops.owned[card.id] = 1; });
const schoolP14 = { dmg: 20 };
L.applyOwnedBonus(schoolP14, schoolSave);
const fourteenMul = L.SCHOOL_CARDS.reduce((m, card) => m * (1 + card.dmg), 1) * 1.02 * 1.03;
assert.ok(Math.abs(schoolP14.dmg - 20 * fourteenMul) < 1e-6);
assert.equal(L.snapshot(schoolSave).schoolOwned, 14);

const jobP = { dmg: 20 };
const jobSave = { shop40: L.normalizeOps({}) };
jobSave.shop40.ops.owned.job_swarm = 1;
jobSave.shop40.ops.owned.job_railLord = 2;
L.applyOwnedBonus(jobP, jobSave);
assert.ok(Math.abs(jobP.dmg - 20 * 1.005 * 1.005) < 1e-6, "每张转职 +0.5%，重复不加");
assert.equal(L.hasJob(jobSave, "mech"), true);
assert.equal(L.hasJob(jobSave, "spore"), false);
assert.equal(L.hasJob({ shop40: L.normalizeOps({}) }, "mech"), false);
const jobP2 = { dmg: 20 };
jobSave.shop40.ops.owned.job_swarm = 9;
L.applyOwnedBonus(jobP2, jobSave);
assert.ok(Math.abs(jobP2.dmg - 20 * 1.005 * 1.005) < 1e-6, "同一张转职重复不叠伤");
assert.equal(L.JOB_CARDS.length, 28);
assert.ok(L.JOB_CARDS.every((card) => card.id.startsWith("job_") && card.r === "SR" && card.kind === "job" && card.dmg === 0.005));
assert.equal(L.snapshot(jobSave).jobOwned, 2);

const fusionP = { dmg: 20 };
const fusionSave = { shop40: L.normalizeOps({}) };
fusionSave.shop40.ops.owned.fusion_magitech = 1;
fusionSave.shop40.ops.owned.fusion_gunshrine = 2;
L.applyOwnedBonus(fusionP, fusionSave);
assert.ok(Math.abs(fusionP.dmg - 20 * 1.008 * 1.008) < 1e-6, "每张融合 +0.8%，重复不加");
assert.equal(L.hasFusion(fusionSave, "mech"), true);
assert.equal(L.hasFusion(fusionSave, "magical"), true);
assert.equal(L.hasFusion(fusionSave, "shrine"), true);
assert.equal(L.hasFusion(fusionSave, "gun"), true);
assert.equal(L.hasFusion(fusionSave, "spore"), false);
assert.equal(L.hasFusion({ shop40: L.normalizeOps({}) }, "mech"), false);
const fusionP2 = { dmg: 20 };
fusionSave.shop40.ops.owned.fusion_magitech = 9;
L.applyOwnedBonus(fusionP2, fusionSave);
assert.ok(Math.abs(fusionP2.dmg - 20 * 1.008 * 1.008) < 1e-6, "同一张融合重复不叠伤");
assert.equal(L.snapshot(fusionSave).fusionOwned, 2);
assert.match(fs.readFileSync(path.join(root, "src/index.html"), "utf8"), /hasFusion\(save,school\)\)w\*=1\.6/);
assert.doesNotMatch(fs.readFileSync(path.join(root, "src/index.html"), "utf8"), /12\/24|融合套装/);

const preferSave = { coins: 20000, shop40: L.normalizeOps({}) };
L.FUSION_CARDS.forEach((card) => {
  if (card.id !== "fusion_soulgun") preferSave.shop40.ops.owned[card.id] = 1;
});
preferSave.shop40.ops.pity = 79;
const preferHit = L.pull(preferSave, 1, () => 0.999);
assert.equal(preferHit.results[0].kind, "fusion");
assert.equal(preferHit.results[0].r, "SSR");
assert.equal(preferHit.results[0].id, "fusion_soulgun", "硬保优先还没拥有的融合");
assert.equal(preferSave.shop40.ops.pity, 0);

const shardSave = { coins: 20000, shop40: L.normalizeOps({}) };
L.CARDS.forEach((card) => { shardSave.shop40.ops.owned[card.id] = 1; });
L.SCHOOL_CARDS.forEach((card) => { shardSave.shop40.ops.owned[card.id] = 1; });
const shardsBefore = shardSave.shop40.ops.shards;
const dupe = L.pull(shardSave, 1, () => 0.5);
assert.equal(dupe.ok, true);
assert.equal(shardSave.shop40.ops.shards, shardsBefore + 1 + 8);

const cheat = L.grantCheat({ coins: 3, shop40: L.normalizeOps({}) });
assert.equal(cheat.coins, 3 + 9999);
assert.equal(cheat.cheatUsed, 1);
assert.deepEqual(Object.keys(L.snapshot(old).cards[0]).sort(), ["count", "id", "kind", "n", "r"]);
assert.equal(typeof L.showReveal, "function");
assert.equal(typeof L.injectStyle, "function");
assert.match(fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8"), /@media\(orientation:landscape\)\{/);
assert.doesNotMatch(fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8"), /orientation:landscape\) and \(min-width:700px\)/);
assert.match(fs.readFileSync(path.join(root, "src/index.html"), "utf8"), /class="landscape46"/);
assert.match(fs.readFileSync(path.join(root, "src/index.html"), "utf8"), /classList\.add\("landscape46"\)/);

const tap9 = Array.from({ length: 9 }, (_, i) => L.portraitTap(1000 + i));
assert.equal(tap9[8].granted, false);
const tap10 = L.portraitTap(1009);
assert.equal(tap10.granted, true);

function fakeEl(tag, attrs = {}) {
  const node = {
    tagName: String(tag).toUpperCase(),
    id: attrs.id || "",
    className: attrs.className || "",
    children: [],
    parentNode: null,
    isConnected: true,
    style: {},
    attrs: { ...attrs },
    _html: "",
    onclick: null,
    onerror: null,
    textContent: "",
    setAttribute(k, v) {
      this.attrs[k] = v;
      if (k === "id") this.id = v;
      if (k === "class") this.className = v;
    },
    getAttribute(k) {
      return this.attrs[k] == null ? null : String(this.attrs[k]);
    },
    appendChild(c) {
      this.children.push(c);
      c.parentNode = this;
      return c;
    },
    removeChild(c) {
      this.children = this.children.filter((x) => x !== c);
      c.parentNode = null;
      return c;
    },
    querySelector(sel) {
      return collect(this).find((n) => matchSel(n, sel)) || null;
    },
    querySelectorAll(sel) {
      return collect(this).filter((n) => matchSel(n, sel));
    },
    get innerHTML() {
      return this._html;
    },
    set innerHTML(v) {
      this._html = String(v || "");
      this.children = parseHtml(this._html, this);
    },
  };
  return node;
}
function collect(root, acc = []) {
  for (const child of root.children || []) {
    acc.push(child);
    collect(child, acc);
  }
  return acc;
}
function matchSel(n, sel) {
  if (sel.startsWith("#")) return n.id === sel.slice(1);
  if (sel.startsWith(".")) return (` ${n.className} `).includes(` ${sel.slice(1)} `);
  if (sel.includes("[data-art]")) return n.tagName === "IMG";
  if (sel === "[data-open]") return n.getAttribute("data-open") != null;
  return n.tagName === String(sel).toUpperCase();
}
function parseHtml(html, parent) {
  const found = [];
  const tagRe = /<([a-z0-9]+)([^>]*)>/gi;
  let m;
  while ((m = tagRe.exec(html))) {
    const raw = m[2] || "";
    const id = (raw.match(/\sid="([^"]+)"/) || [])[1] || "";
    const cls = (raw.match(/\sclass="([^"]+)"/) || [])[1] || "";
    const dataCard = (raw.match(/\sdata-card="([^"]+)"/) || [])[1] || "";
    const node = fakeEl(m[1], { id, className: cls, "data-card": dataCard });
    node.parentNode = parent;
    found.push(node);
  }
  return found;
}

const head = fakeEl("head");
const body = fakeEl("body");
const allNodes = () => collect(head).concat(collect(body));
const document = {
  head,
  body,
  documentElement: fakeEl("html"),
  getElementById(id) {
    return allNodes().find((n) => n.id === id) || null;
  },
  createElement(tag) {
    return fakeEl(tag);
  },
};
const vis = { document, Math, Date, Object, Array, Number, String, TEST_MODE: true, setTimeout(fn) { fn(); } };
vis.window = vis;
vis.globalThis = vis;
vm.runInNewContext(code, vis);
const V = vis.window.SakurayoLobby;
V.injectStyle();
assert.equal(document.getElementById("sakurayo-lobby-css").id, "sakurayo-lobby-css");
const firstCss = document.getElementById("sakurayo-lobby-css");
V.injectStyle();
const secondCss = document.getElementById("sakurayo-lobby-css");
assert.ok(secondCss);
assert.notEqual(firstCss, secondCss);
assert.equal(head.children.filter((n) => n.id === "sakurayo-lobby-css").length, 1);

const gachaHost = fakeEl("div", { id: "gachaBody46" });
body.appendChild(gachaHost);
const save = { coins: 20000, character: "sayo", shop40: V.normalizeOps({}) };
V.renderGacha(gachaHost, save, { pull() {}, art: (p) => "game/art/" + p, character: "sayo" });
assert.match(gachaHost.innerHTML, /id="gachaPull1"/);
assert.match(gachaHost.innerHTML, /id="gachaPull10"/);
assert.match(gachaHost.innerHTML, /镜界寻访/);
assert.match(gachaHost.innerHTML, /160/);
assert.match(gachaHost.innerHTML, /1440/);
assert.match(gachaHost.innerHTML, /距证人保底还有/);
assert.match(gachaHost.innerHTML, /data-pool="remnant"/);
assert.match(gachaHost.innerHTML, /data-pool="fashion"/);
assert.match(gachaHost.innerHTML, /data-pool="weapon"/);
assert.match(gachaHost.innerHTML, /碎镜片/);
assert.ok(gachaHost.querySelector("#gachaPull1"));
assert.ok(gachaHost.querySelector("#gachaPull10"));

const rosterDrawer = fakeEl("section", { id: "rosterDrawer" });
rosterDrawer.className = "drawer wishDrawer46";
const rosterHost = fakeEl("div", { id: "rosterBody46" });
body.appendChild(rosterDrawer);
rosterDrawer.appendChild(rosterHost);
V.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.equal((rosterHost.innerHTML.match(/class="rosterSlot46/g) || []).length, 8);
assert.match(rosterHost.innerHTML, /id="rosterWall46"/);
assert.match(rosterHost.innerHTML, /未回收/);
assert.match(rosterHost.innerHTML, /镜界仓库/);
assert.match(rosterHost.innerHTML, /data-roster="scrap"/);
assert.match(rosterHost.innerHTML, /data-roster="school"/);
assert.match(rosterHost.innerHTML, /rosterSlot46 r-R lock" data-card="last_witness"/);
assert.match(rosterHost.innerHTML, /rosterSlot46 r-R" data-card="sayo_echo"/);
assert.match(rosterHost.innerHTML, /rosterSlot46 r-R" data-card="aya_petal"/);
assert.match(rosterHost.innerHTML, /card_back\.webp/);
assert.equal(rosterHost.innerHTML.includes("last_witness.webp"), false);
V.setRosterTab(save, "school");
V.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.equal((rosterHost.innerHTML.match(/class="rosterSlot46/g) || []).length, 14);
assert.match(rosterHost.innerHTML, /待寻访/);
assert.match(rosterHost.innerHTML, /data-card="school_shrine"/);
assert.equal(rosterHost.innerHTML.includes("school_shrine.webp"), false);
assert.match(rosterHost.innerHTML, /card_back\.webp/);
V.setRosterTab(save, "job");
V.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.equal((rosterHost.innerHTML.match(/class="rosterSlot46/g) || []).length, 28);
assert.match(rosterHost.innerHTML, /data-roster="job"/);
assert.match(rosterHost.innerHTML, /data-card="job_swarm"/);
assert.equal(rosterHost.innerHTML.includes("job_swarm.webp"), false);
assert.match(rosterHost.innerHTML, /card_back\.webp/);
assert.match(rosterHost.innerHTML, /待寻访/);
V.setRosterTab(save, "fusion");
V.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.equal((rosterHost.innerHTML.match(/class="rosterSlot46/g) || []).length, 24);
assert.match(rosterHost.innerHTML, /data-roster="fusion"/);
assert.match(rosterHost.innerHTML, /data-card="fusion_magitech"/);
assert.equal(rosterHost.innerHTML.includes("后续写入"), false);
assert.equal(rosterHost.innerHTML.includes("星核机甲少女"), false);
assert.equal(rosterHost.innerHTML.includes("血炼剑仙"), false);
assert.equal(rosterHost.innerHTML.includes("fusion_magitech.webp"), false);
assert.match(rosterHost.innerHTML, /card_back\.webp/);
assert.match(rosterHost.innerHTML, /待寻访/);
V.setRosterTab(save, "fashion");
V.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.equal((rosterHost.innerHTML.match(/class="rosterSlot46/g) || []).length, 12);
assert.match(rosterHost.innerHTML, /data-roster="fashion"/);
assert.match(rosterHost.innerHTML, /data-roster="weapon"/);
V.setRosterTab(save, "chronicle");
V.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });
assert.match(rosterHost.innerHTML, /月城小夜 · 未写完的夜/);
assert.match(rosterHost.innerHTML, /第零次死亡/);
assert.match(rosterHost.innerHTML, /百目共视/);
assert.match(rosterHost.innerHTML, /零号企业/);
assert.match(rosterHost.innerHTML, /失败者剑冢/);
assert.match(rosterHost.innerHTML, /镜零之后/);
assert.equal((rosterHost.innerHTML.match(/class="chronicleCard46/g) || []).length, 5);
V.setRosterTab(save, "scrap");
V.renderRoster(rosterHost, save, { art: (p) => "game/art/" + p });

const drawer = fakeEl("section", { id: "gachaDrawer" });
drawer.className = "drawer wishDrawer46";
body.appendChild(drawer);
V.showReveal([{ id: "last_witness", n: "碎镜后的人", r: "R" }], { art: (p) => "game/art/" + p });
const reveal = document.getElementById("gachaReveal46");
assert.ok(reveal);
assert.match(reveal.innerHTML, /收下证词/);
assert.match(reveal.innerHTML, /revealCard46/);
assert.match(reveal.innerHTML, /revealGem46/);
assert.match(fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8"), /\.revealLegend46\{/);
assert.match(fs.readFileSync(path.join(root, "src/runtime/sakurayo-lobby.js"), "utf8"), /\.revealCard46\.r-LEGEND/);
V.showReveal([{ id: "fashion_sayo_crown", n: "终夜樱冠", r: "SSR", legend: true }], { art: (p) => "game/art/" + p });
assert.match(document.getElementById("gachaReveal46").innerHTML, /revealLegend46/);
assert.match(document.getElementById("gachaReveal46").innerHTML, /传说/);

const locked = collect(rosterHost).find((n) => (` ${n.className} `).includes(" lock "));
assert.ok(locked);
locked.onclick();
const peek = document.getElementById("rosterPeek46");
assert.ok(peek);
assert.match(peek.innerHTML, /尚未回收/);
assert.match(peek.innerHTML, /card_back\.webp/);

const heroRoot = fakeEl("div");
body.appendChild(heroRoot);
V.bindHeroTap(heroRoot, () => {});
assert.equal(heroRoot.querySelector("#heroTap46").id, "heroTap46");
assert.equal(heroRoot.querySelector("#heroHead46").id, "heroHead46");

const modes = V.renderStageModes("testimony");
assert.match(modes, /id="modeBar46"/);
assert.match(modes, /id="modeTestimony46"/);
assert.match(modes, /id="modeStory46"/);
assert.match(modes, /id="modeMainGod46"/);
assert.match(modes, /回收演习/);
assert.match(modes, /证词模式/);
assert.match(modes, /主神空间/);
assert.match(modes, /id="modeTestimony46"[^>]*class="on"/);
assert.match(V.renderStageModes("story"), /id="modeStory46"[^>]*class="on"/);

const archiveHost = fakeEl("div", { className: "archiveDock46" });
for (const [id, label] of [["talent", "永久天赋"], ["story", "剧情档案"], ["asc", "职业与飞升"], ["ach", "成就图鉴"]]) {
  const btn = fakeEl("button", { "data-open": id });
  btn.innerHTML = label;
  archiveHost.appendChild(btn);
}
V.dressArchive(archiveHost);
const storyBtn = archiveHost.children.find((n) => n.getAttribute("data-open") === "story");
assert.match(storyBtn.innerHTML, /<b>剧情档案<\/b><small>四章证词<\/small>/);
assert.match(archiveHost.children[0].innerHTML, /永久天赋/);

console.log("PASS lobby unit: rates, default two cards, pity, ten-pull, cheat taps, stage modes");

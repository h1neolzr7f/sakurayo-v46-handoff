import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-talent-tree.js"), "utf8");
const htmlSrc = fs.readFileSync(path.join(root, "src/index.html"), "utf8");

assert.match(htmlSrc, /runtime\/sakurayo-talent-tree\.js/);
assert.match(htmlSrc, /function buyTalent46\(/);
assert.match(htmlSrc, /id="talentDrawer"><div class="dhead"><h2>樱核树/);
assert.doesNotMatch(htmlSrc, /id="talentDrawer"><div class="dhead"><h2>永久天赋/);

const sandbox = { window: {}, document: null, Math, Object, Number, String };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const T = sandbox.window.SakurayoTalentTree;

assert.equal(T.version, "4.6.0");
assert.equal(T.BRANCHES.length, 5);
assert.deepEqual(T.BRANCHES.map((b) => b.id).sort().join(","), "atk,flow,hp,luck,mag");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const empty = T.normalizeTal({});
assert.deepEqual(plain(empty), { atk: 0, hp: 0, luck: 0, mag: 0, flow: 0 });
assert.deepEqual(plain(T.normalizeTal({ atk: 3, hp: "2", unknown: 9, flow: -1 })), { atk: 3, hp: 2, luck: 0, mag: 0, flow: 0 });

assert.deepEqual(plain(T.milestones(10)), [1, 4, 7, 10]);
assert.deepEqual(plain(T.milestones(8)), [1, 3, 6, 8]);

assert.equal(T.costOf("atk", 0), 40);
assert.equal(T.costOf("hp", 2), 95);
assert.equal(T.costOf("luck", 1), 95);

const blocked = T.canBuy("atk", { atk: 0 }, 10);
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, "coins");
assert.equal(blocked.cost, 40);

const ready = T.canBuy("atk", { atk: 0 }, 40);
assert.equal(ready.ok, true);
assert.equal(ready.next, 1);

const capped = T.canBuy("luck", { luck: 8 }, 9999);
assert.equal(capped.ok, false);
assert.equal(capped.reason, "max");

assert.equal(T.effectLine("atk", 2), "基础伤害 +10%");
assert.equal(T.effectLine("hp", 3), "初始生命 +24");
assert.equal(T.effectLine("flow", 4), "冷却 -8%");

const map = T.layout({ tal: { atk: 4, hp: 0, luck: 1, mag: 0, flow: 0 } });
assert.equal(map.nodes.length, 20);
const atkNodes = map.nodes.filter((n) => n.id === "atk");
assert.equal(atkNodes.filter((n) => n.filled).length, 2);
assert.equal(atkNodes.some((n) => n.next), true);
assert.ok(map.nodes.every((n) => n.x > 20 && n.x < 620 && n.y > 20 && n.y < 400));

T.select("hp");
const markup = T.html({
  tal: { atk: 4, hp: 1, luck: 0, mag: 0, flow: 0 },
  coins: 200,
  character: { short: "小夜", name: "月城小夜" },
  rank: 6,
});
assert.match(markup, /class="talentTree46"/);
assert.match(markup, /樱核树/);
assert.match(markup, /巫女护体/);
assert.match(markup, /点枝 🌸/);
assert.match(markup, /data-branch="atk"/);
assert.match(markup, /data-buy="hp"/);

const oldSave = { coins: 12, unlock: 1, done: [], tal: { atk: 2 }, mainGod: { points: 0 } };
const merged = T.normalizeTal(oldSave.tal);
assert.equal(merged.atk, 2);
assert.equal(merged.hp, 0);

console.log("PASS talent tree unit: five branches, old save fill, costs, layout");

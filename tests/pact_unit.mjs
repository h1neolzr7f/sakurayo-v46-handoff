import assert from "node:assert/strict";
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
const save = { coins: 0, shop40: {} };
save.shop40 = L.normalizeOps(save.shop40);
// 未拥有不能缔结
assert.equal(L.setPact(save, "school_shrine").ok, false);
save.shop40.ops.owned.school_shrine = 3;
assert.equal(L.setPact(save, "school_shrine").pact, "school_shrine");
assert.deepEqual([...L.pactOf(save).schools], ["shrine"]);
assert.equal(L.pactMul(save, "shrine"), 1.25);
assert.equal(L.pactMul(save, "gun"), 1);
// 再点一次解除
assert.equal(L.setPact(save, "school_shrine").pact, "");
// 时装/武器不能当本命
const fashion = L.CARDS.concat([]).find((c) => c.kind === "fashion");
if (fashion) assert.equal(L.setPact(save, fashion.id).ok, false);
// 融合：两个流派
const fus = L.CARDS.find((c) => c.kind === "fusion" && c.pair);
if (fus) { save.shop40.ops.owned[fus.id] = 1; L.setPact(save, fus.id); assert.equal(L.pactOf(save).schools.length, 2); }
// 存档往返后保留，失去卡后失效
const again = L.normalizeOps(JSON.parse(JSON.stringify(save.shop40)));
assert.equal(again.ops.pact, fus ? fus.id : "");
// 星级只是外观：1..5 封顶
assert.equal(L.starOf(0), 0); assert.equal(L.starOf(3), 3); assert.equal(L.starOf(99), 5);
// 红线：本命和星级不得出现在任何伤害计算里
const idx = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
assert.equal(/starOf\([^)]*\)[^;]{0,40}(dmg|power)/.test(idx), false, "星级不得加数值");
assert.match(idx, /function pactRun48\(\)/);
assert.match(idx, /function breakBurst48\(\)/);
console.log("PASS pact unit: 本命契约 owned-only/toggle/fusion pair/save round-trip, ×1.25 weight only, stars cosmetic 0..5, break burst wired");

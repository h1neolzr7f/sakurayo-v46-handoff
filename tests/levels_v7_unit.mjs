// RESEARCH_V7 ④：奖励预告、妖气节点（风险/回报）、新事件、场景机关（灯笼阵 / 鸟居）
import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert/strict';
const ctx = vm.createContext({ console, Math, JSON }); ctx.globalThis = ctx; ctx.window = ctx;
for (const f of ['run', 'props']) vm.runInContext(fs.readFileSync(`src/runtime/sakurayo-${f}.js`, 'utf8'), ctx);
const R = ctx.SakurayoRun, PR = ctx.SakurayoProps;
let haunts = 0, rewards = 0;
for (let seed = 1; seed <= 40; seed++) { const st = R.create(seed, 'sayo', 'tech');
  for (const L of st.map) for (const row of L) for (const n of row) { if (n.type === 'fight' || n.type === 'goal') { assert.ok(R.REWARD[n.reward], 'every combat node previews a reward'); rewards++; } if (n.haunt && n.type === 'fight') { haunts++;
      const a = R.levelSpec(st, n), b = R.levelSpec(st, Object.assign({}, n, { haunt: 0 })); assert.ok(a.n.startsWith('妖气'));
      assert.ok((a.goal.t || 0) > (b.goal.t || 0) || (a.goal.n || 0) > (b.goal.n || 0), 'haunt is harder');
      const s1 = JSON.parse(JSON.stringify(st)), s2 = JSON.parse(JSON.stringify(st)); s1.pending = []; s2.pending = [];
      const o1 = R.complete(s1, n, true), o2 = R.complete(s2, Object.assign({}, n, { haunt: 0 }), true); assert.ok(o1.shards > o2.shards && o1.relicOffer, 'haunt pays more + relic'); } } }
assert.ok(haunts > 10 && rewards > 200, `haunts ${haunts}, rewards ${rewards}`);
// 场景机关：灯笼点燃后持续灼烧，鸟居给加速，有冷却
const list = PR.create(1, 3000, 3000, 1500, 1500, 7, null), lan = list.find(p => p.kind === 'lantern'), tor = list.find(p => p.kind === 'torii'); assert.ok(lan && tor, 'lantern + torii placed');
let burns = 0, haste = 0; const api = { gems() {}, heal() {}, shield() {}, coins() {}, fx() {}, toast() {}, sound() {}, aoe() {}, burn() { burns++; }, haste() { haste++; } };
for (let i = 0; i < 300; i++) PR.update(list, { x: lan.x, y: lan.y, r: 14 }, 1 / 30, api, true);
assert.ok(burns >= 7 && burns <= 9, 'lantern burns ~8 ticks over 4s then cools down: ' + burns);
for (let i = 0; i < 60; i++) PR.update(list, { x: tor.x, y: tor.y, r: 14 }, 1 / 30, api, true); assert.equal(haste, 1, 'torii haste once per cooldown');
console.log(`PASS levels v7: reward preview on ${rewards} nodes, ${haunts} haunted nodes (harder + double shards + relic), lantern/torii mechanics`);

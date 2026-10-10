// SakurayoRun pure logic: deterministic map, connectivity, node specs, choices, relics, pending effects, layer progression, sanitize.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
createRequire(import.meta.url)('../src/runtime/sakurayo-run.js');
const R = globalThis.SakurayoRun;
const a = R.create(1234, 'aya'), b = R.create(1234, 'aya');
assert.deepEqual(a.map, b.map, 'same seed → same map');
for (const rows of a.map) {
  assert.equal(rows.length, R.ROWS); assert.equal(rows[0][0].type, 'fight'); assert.equal(rows.at(-1)[0].type, 'boss');
  for (let r = 1; r < rows.length; r++) for (const n of rows[r]) assert.ok(rows[r - 1].some(p => p.next.includes(n.id)), 'every node reachable ' + n.id);
  for (let r = 0; r < rows.length - 1; r++) for (const n of rows[r]) assert.ok(n.next.length >= 1, 'every node continues');
}
// types coverage over seeds
const seen = new Set(); for (let s = 1; s < 40; s++) R.create(s).map.flat(2).forEach(n => seen.add(n.type));
for (const t of Object.keys(R.NODE)) assert.ok(seen.has(t), 'node type appears: ' + t);
// specs map onto SakurayoLevels objective types
const types = new Set(); for (let s = 1; s < 40; s++) { const st = R.create(s); st.map.flat(2).filter(n => R.isCombat(n.type)).forEach(n => { const sp = R.levelSpec(st, n); assert.ok(sp.run46 && /^R\d/.test(sp.id)); types.add(sp.type); }); }
for (const t of ['survive', 'clear', 'timed', 'escort', 'mech', 'channel', 'boss']) assert.ok(types.has(t), 'spec type ' + t);
// routing
const st = R.create(77); assert.equal(R.enter(st, 'x'), null); const n0 = R.available(st)[0]; R.enter(st, n0.id);
assert.ok(R.available(st).every(n => n0.next.includes(n.id)));
// shop/choices
const shop = { type: 'shop', row: 2, col: 0, layer: 1 }; let opts = R.options(st, shop);
assert.equal(R.choose(st, shop, opts.find(o => o.k === 'heal')).ok, false, 'cannot afford'); st.shards = 200;
assert.ok(R.choose(st, shop, opts.find(o => o.k === 'heal')).ok); assert.equal(st.shards, 170);
const rel = opts.find(o => o.k === 'relic'); if (rel) { R.choose(st, shop, rel); assert.ok(st.relics.includes(rel.id)); }
R.choose(st, { type: 'shrine' }, { k: 'level' });
const P = { hp: 50, maxHp: 100, dmg: 10, mag: 90, spd: 200, crit: .05, rate: .45 }; const r = R.applyPending(st, P);
assert.equal(r.levels, 1); assert.ok(P.hp > 50); assert.equal(st.pending.length, 0, 'pending consumed once');
// layer progression → run win
const w = R.create(5); for (let L = 1; L <= R.LAYERS; L++) { const boss = w.map[L - 1].at(-1)[0]; w.at = null; const out = R.complete(w, boss, true, { level: 3 }); if (L < R.LAYERS) assert.equal(out.nextLayer, L + 1); else assert.ok(out.runWin && w.done && w.win); }
assert.ok(R.runReward(w) >= 300);
const l = R.create(6); R.complete(l, l.map[0][0][0], false); assert.ok(l.done && !l.win); assert.ok(R.runReward(l) >= 120);
// snapshot drops transient + non-serialisable
const snap = R.snapshot({ x: 1, y: 2, level: 4, up: { a: 2 }, banterSeen: new Set([1]), weapons46: { spread: { lv: 2 } } });
assert.deepEqual(snap, { level: 4, up: { a: 2 }, weapons46: { spread: { lv: 2 } } });
// sanitize
assert.equal(R.sanitize({ v: 2 }), null); const bad = JSON.parse(JSON.stringify(R.create(9))); bad.relics = ['nope', 'petal']; bad.at = 'zz'; const ok = R.sanitize(bad);
assert.deepEqual(ok.relics, ['petal']); assert.equal(ok.at, null);
console.log('PASS run unit: deterministic connected maps, all node/objective types, routing, shop/shrine/relic choices, pending effects, layer→run win, snapshot, sanitize');

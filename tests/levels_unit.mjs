import assert from 'node:assert/strict';
await import('../src/runtime/sakurayo-levels.js');
const L = globalThis.SakurayoLevels;
assert.equal(L.LEVELS.length, 16); assert.deepEqual([...new Set(L.LEVELS.map(l => l.type))].sort(), ['boss', 'channel', 'clear', 'escort', 'mech', 'survive', 'timed']);
for (const ch of [1, 2, 3, 4]) { const c = L.chapter(ch); assert.equal(c.length, 4); assert.equal(c[3].type, 'boss'); assert.ok(new Set(c.map(l => l.type)).size >= 3, 'objective types rotate inside a chapter'); }
// unlock + legacy mapping
const fresh = { unlock: 1, done: [], stars46: {} };
assert.deepEqual(L.LEVELS.filter(l => L.unlocked(fresh, l.id)).map(l => l.id), ['1-1']);
fresh.stars46['1-1'] = 1; assert.ok(L.unlocked(fresh, '1-2')); assert.ok(!L.unlocked(fresh, '1-3'));
const legacy = { unlock: 2, done: [1] }; assert.ok(L.cleared(legacy, '1-4')); assert.ok(L.unlocked(legacy, '1-3')); assert.ok(L.unlocked(legacy, '2-1')); assert.ok(!L.unlocked(legacy, '2-2'));
// rating
const l11 = L.find('1-1');
assert.deepEqual(L.rate(l11, { win: true, hits: 3, chests: 2 }), [true, true, true]);
assert.deepEqual(L.rate(l11, { win: true, hits: 9, chests: 1 }), [true, false, false]);
assert.deepEqual(L.rate(l11, { win: false, hits: 0, chests: 5 }), [false, false, false], 'no stars on a loss');
const s = {}; assert.equal(L.record(s, '1-1', [true, true, false]).stars, 2); assert.equal(L.record(s, '1-1', [true, false, false]).best, 2, 'best kept'); assert.equal(s.stars46['1-1'], 2);
// objective sim: survive / clear / channel / mech
const P = { x: 500, y: 500, hits46: 0 }; let kills = 0; const enemies = [];
const api = { P, worldW: 1000, worldH: 1000, kills: () => kills, enemies: () => enemies, toast() {}, sound() {}, aoe() { enemies.forEach(e => { e.dead = true; }); }, spawnTarget(x, y, hp) { const e = { x, y, hp, max: hp, r: 30 }; enemies.push(e); return e; } };
let o = L.create(l11, api); for (let t = 0; t < 89; t++) L.tick(l11, o, 1, api); assert.ok(!o.done); L.tick(l11, o, 1, api); assert.ok(o.done);
const l12 = L.find('1-2'); o = L.create(l12, api); kills = 59; L.tick(l12, o, 0.1, api); assert.ok(!o.done); kills = 60; L.tick(l12, o, 0.1, api); assert.ok(o.done);
const l33 = L.find('3-3'); o = L.create(l33, api); P.x = o.zone.x + 300; L.tick(l33, o, 10, api); assert.equal(o.chan, 0, 'outside the circle no progress'); P.x = o.zone.x; P.y = o.zone.y; for (let i = 0; i < 31; i++) L.tick(l33, o, 1, api); assert.ok(o.done);
const l22 = L.find('2-2'); o = L.create(l22, api); enemies.push({ x: 0, y: 0, r: 10 }, { x: 1, y: 1, r: 10 });
for (const p of o.pads) { P.x = p.x; P.y = p.y; L.tick(l22, o, 1.3, api); } assert.ok(o.done); assert.equal(o.mechKills, 2);
const l21 = L.find('2-1'); o = L.create(l21, api); assert.equal(o.targets.length, 4); L.tick(l21, o, l21.goal.limit + 1, api); assert.equal(o.fail, '时间到');
console.log('PASS levels unit: 16 nodes / 7 types, unlock + legacy, star rating, survive/clear/channel/mech/timed logic');

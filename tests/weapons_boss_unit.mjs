import assert from 'node:assert/strict';
import '../src/runtime/sakurayo-weapons.js';
import '../src/runtime/sakurayo-boss.js';
const W = globalThis.SakurayoWeapons, B = globalThis.SakurayoBoss;
assert.equal(W.ORDER.length, 7);
const P = { x: 0, y: 0, dmg: 10, weaponAngle: 0 };
for (const id of W.ORDER) { assert.ok(W.stats(id, 5).dmg >= W.stats(id, 1).dmg); assert.match(W.describe(id, 5, true), /进化/); assert.doesNotMatch(W.describe(id, 5, false), /进化/); }
W.gain(P, 'spread'); W.gain(P, 'orbit'); W.gain(P, 'laser'); W.gain(P, 'bomb');
assert.deepEqual(W.choices(P).sort(), ['bomb', 'laser', 'orbit', 'spread'], 'four weapon slots max');
for (let i = 0; i < 9; i++) W.gain(P, 'spread'); assert.equal(W.level(P, 'spread'), 5, 'caps at Lv5');
const shots = [], hits = [], enemy = { x: 70, y: 0, r: 14 };
const api = { P, now: 0, target: () => enemy, push: b => shots.push(b), aoe: () => hits.push('aoe'), hit: (e, d) => hits.push(d), enemiesNear: () => [enemy], fx() {}, sound() {} };
for (let t = 0; t < 40; t++) { api.now = t / 10; W.tick(0.1, api); }
assert.ok(shots.length >= 11 && hits.length > 0, 'weapons fire and orbit/laser hit');
const boss = B.init({ max: 1000, phase: 1 });
assert.equal(B.fill(boss, 60), false); assert.equal(B.fill(boss, 50), true, 'full gauge breaks');
assert.equal(B.damageMul(boss), B.BREAK_MUL); assert.equal(B.fill(boss, 100), false, 'no refill during break');
B.tick(boss, B.BREAK_TIME + .1, 0); assert.equal(B.damageMul(boss), 1);
boss.phase = 4; assert.equal(B.tick(boss, .1, B.ENRAGE_AFTER + 1), 'enrage');
assert.match(B.label(boss), /狂暴/);
console.log('PASS weapons+boss unit');
{ const Q = { weapons46: {} }; for (let i = 0; i < 5; i++) W.gain(Q, 'spread');
  assert.deepEqual(W.evolve(Q, () => false), [], 'no evolution without partner');
  assert.deepEqual(W.evolve(Q, id => id === 'multi'), ['spread'], 'partner unlocks evolution');
  assert.equal(W.stats('spread', 5, true).c > W.stats('spread', 5, false).c, true); console.log('PASS evolution pairs'); }
{ const b = B.init({ max: 1000, hp: 100, phase: 1 }); assert.equal(B.gateHp(b, 2), 751, 'phase gate holds HP'); assert.equal(b.gated46, true);
  b.hp = 100; assert.equal(B.gateHp(b, B.MIN_PHASE + 1), 501, 'after one gate the next quarter holds'); b.hp = 100; assert.equal(B.gateHp(b, B.MIN_PHASE * 3 + 1), 100, 'gate releases after three quarters');
  assert.equal(B.overtimeMul(30), 1); assert.ok(B.overtimeMul(60) > 1.5); b.hp = 5; b.ungate46 = true; assert.equal(B.gateHp(b, 1), 5, 'debug/test-set HP is not gated'); b.ungate46 = false; b.phase = 2; b.hp = 100; assert.equal(B.gateHp(b, B.MIN_PHASE * 2 + 1), 251, 'gate keyed on fight age, not phase index');
  console.log('PASS phase gate + overtime'); }

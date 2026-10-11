// 镜空（东方式弹幕射击）纯逻辑：确定性、三角色用时比 ≤1.30、形态/路线都能通关、符卡 Boss、低速判定点/擦弹/Bomb/决死/残机规则；“人类水平”自动驾驶 Boss 胜率。
import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { console, Math, performance: { now: () => 0 } }; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/runtime/sakurayo-shmup.js', 'utf8'), ctx);
const S = ctx.SakurayoShmup, J = x => JSON.parse(JSON.stringify(x));
const run = o => S.simulate(Object.assign({ seed: 7, layer: 1 }, o), 500);
assert.deepEqual(J(run({ character: 'sayo' })), J(run({ character: 'sayo' })), 'deterministic for same seed');
const T = {};
for (const ch of ['sayo', 'aya', 'rion']) {
  let sum = 0; for (const seed of [3, 7, 11]) { const r = run({ character: ch, seed, route: seed === 7 ? 'bio' : 'tech' }); assert.ok(r.win, `${ch} seed ${seed} clears`); sum += r.time; }
  T[ch] = sum / 3;
  for (const slot of ['guard', 'speed', 'burst']) assert.ok(run({ character: ch, form: { slot } }).win, `${ch} ${slot} form clears`);
}
const v = Object.values(T), ratio = Math.max(...v) / Math.min(...v);
assert.ok(ratio <= 1.3, 'character time ratio ' + ratio.toFixed(2) + ' ' + JSON.stringify(T));
// 规则
{ const g = new S.Game({ character: 'sayo', seed: 1, layer: 1 });
  assert.equal(g.P.hit, 3, 'tiny hitbox'); g.keys.Shift = 1; g.update(1 / 60); assert.equal(g.snapshot().focus, true, 'Shift = focus');
  const x0 = g.P.x; g.keys.ArrowLeft = 1; g.update(0.1); assert.ok(Math.abs(g.P.x - x0 - (-g.P.slow * 0.1)) < 1, 'focus = slow speed'); g.keys = {};
  g.P.inv = 0; g.B = []; g.eb(g.P.x + 14, g.P.y - 40, Math.PI / 2, 600, 'rice'); for (let i = 0; i < 10; i++) g.update(1 / 60); assert.ok(g.P.graze >= 1 && g.P.lives === g.lives0, 'graze without hit');
  g.P.inv = 0; g.B = []; g.eb(g.P.x, g.P.y - 30, Math.PI / 2, 900, 'orb'); for (let i = 0; i < 4; i++) g.update(1 / 60); assert.ok(g.P.deathT > 0, 'death-bomb window open');
  const b0 = g.P.bombs; assert.ok(g.bomb() && g.P.bombs === b0 - 1, 'death bomb'); for (let i = 0; i < 20; i++) g.update(1 / 60); assert.equal(g.P.lives, g.lives0, 'death bomb saves the life');
  g.P.inv = 0; g.P.bombT = 0; g.B = []; g.eb(g.P.x, g.P.y - 30, Math.PI / 2, 900, 'orb'); for (let i = 0; i < 30; i++) g.update(1 / 60); assert.equal(g.P.lives, g.lives0 - 1, 'hit = lose a life'); }
{ const g = new S.Game({ character: 'aya', seed: 2, layer: 2, kind: 'boss' }); g.auto = true; let names = new Set(); for (let t = 0; t < 400 && !g.done; t += 1 / 60) { g.update(1 / 60); const s = g.snapshot(); if (s.boss && s.boss.card) names.add(s.boss.card); }
  assert.ok(g.win && names.size === 3, 'boss: 3 named spell cards ' + [...names].join('/')); }
assert.equal(new S.Game({ character: 'sayo', form: { slot: 'speed' } }).P.hit, 2, 'speed form = 2px hitbox');
assert.ok(new S.Game({ character: 'sayo', route: 'tech' }).options().length > new S.Game({ character: 'sayo', route: 'bio' }).options().length, 'tech route = extra option');
// “人类水平”自动驾驶（反应延迟 0.15 s + 判断噪声）打满构筑以外的普通 Boss：胜率 ≥ 75%
let w = 0, n = 0; for (const ch of ['sayo', 'aya', 'rion']) for (let L = 1; L <= 3; L++) for (let s = 1; s <= 3; s++) { const r = S.simulate({ character: ch, seed: s * 13, layer: L, kind: 'boss', power: 1 + 0.3 * L, skill: 0.3, route: s % 2 ? 'tech' : 'bio' }, 500); w += r.win ? 1 : 0; n++; }
assert.ok(w / n >= 0.75, 'boss win rate (skill 0.3) ' + (w / n).toFixed(2));
console.log('PASS shmup unit (touhou-style): deterministic, chars/forms/routes clear, time ratio', ratio.toFixed(2), JSON.stringify(Object.fromEntries(Object.entries(T).map(([k, x]) => [k, +x.toFixed(1)]))), 'focus/graze/deathbomb/lives OK, boss winrate', (w / n).toFixed(2));

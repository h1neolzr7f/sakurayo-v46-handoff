// 镜弹（弹珠）/ 镜斗（格斗）纯逻辑：确定性、三角色首层必胜、构筑与形态都能生效且能通关、三角色用时比 ≤1.30。
import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { console, Math }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['pinball', 'duel']) vm.runInContext(fs.readFileSync(`src/runtime/sakurayo-${f}.js`, 'utf8'), ctx);
const PB = ctx.SakurayoPinball, D = ctx.SakurayoDuel, J = x => JSON.parse(JSON.stringify(x));
assert.deepEqual(J(PB.simulate({ character: 'aya', seed: 5 }, 80)), J(PB.simulate({ character: 'aya', seed: 5 }, 80)), 'pinball deterministic');
assert.deepEqual(J(D.simulate({ character: 'rion', seed: 5 })), J(D.simulate({ character: 'rion', seed: 5 })), 'duel deterministic');
const ratio = (fn, key) => { const T = {}; for (const ch of ['sayo', 'aya', 'rion']) { let s = 0; for (let seed = 1; seed <= 6; seed++) { const r = fn(ch, seed); assert.ok(r.win, `${key} ${ch} seed ${seed} wins layer 1`); s += r[key]; } T[ch] = s / 6; } const v = Object.values(T); return [Math.max(...v) / Math.min(...v), T]; };
const [rp, tp] = ratio((ch, seed) => PB.simulate({ character: ch, seed, layer: 1 }, 80), 'turns');
assert.ok(rp <= 1.3, 'pinball turn ratio ' + rp.toFixed(2) + JSON.stringify(tp));
const [rd, td] = ratio((ch, seed) => D.simulate({ character: ch, seed, layer: 1 }), 'time');
assert.ok(rd <= 1.3, 'duel time ratio ' + rd.toFixed(2) + JSON.stringify(td));
for (const slot of ['guard', 'speed', 'burst']) for (const w of ['spread', 'bomb', 'laser', 'homing', 'pierce', 'orbit']) {
  const o = { character: 'sayo', seed: 3, layer: 1, form: { slot }, weapons: { [w]: { lv: 3 } } };
  assert.ok(PB.simulate(o, 80).win, `pinball ${slot}/${w}`);
  const r = D.simulate(o); assert.ok(r.win, `duel ${slot}/${w}`); assert.equal(r.special, w, 'build picks the special move');
}
const g = new PB.Game({ character: 'sayo', seed: 1, form: { slot: 'guard' } }); assert.ok(g.ball.r > 26 && g.dmgTaken < 1, 'guard form = big ball + damage reduction');
console.log('PASS modes unit: pinball/duel deterministic, layer-1 wins, ratio', rp.toFixed(2), rd.toFixed(2), 'all forms×builds clear');

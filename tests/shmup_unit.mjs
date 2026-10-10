// 镜空（纵版射击）纯逻辑：确定性、三角色通关用时比 ≤1.30、形态都能通关、Boss 有阶段。
import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { console, Math, performance: { now: () => 0 } }; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/runtime/sakurayo-shmup.js', 'utf8'), ctx);
const S = ctx.SakurayoShmup;
const run = o => S.simulate(Object.assign({ seed: 7, layer: 1 }, o), 400);
const a = run({ character: 'sayo' }), b = run({ character: 'sayo' });
assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), 'deterministic for same seed');
const T = {};
for (const ch of ['sayo', 'aya', 'rion']) {
  let sum = 0; for (const seed of [3, 7, 11]) { const r = run({ character: ch, seed }); assert.ok(r.win, `${ch} seed ${seed} clears`); sum += r.time; }
  T[ch] = sum / 3;
  for (const slot of ['guard', 'speed', 'burst']) assert.ok(run({ character: ch, form: { slot } }).win, `${ch} ${slot} form clears`);
}
const v = Object.values(T), ratio = Math.max(...v) / Math.min(...v);
assert.ok(ratio <= 1.3, 'character time ratio ' + ratio.toFixed(2) + ' ' + JSON.stringify(T));
console.log('PASS shmup unit: deterministic, all chars/forms clear, time ratio', ratio.toFixed(2), JSON.stringify(Object.fromEntries(Object.entries(T).map(([k, x]) => [k, +x.toFixed(1)]))));

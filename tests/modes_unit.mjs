// 镜弹（弹珠）/ 镜斗（格斗）纯逻辑：确定性、三角色首层必胜、构筑与形态都能生效且能通关、三角色用时比 ≤1.30。
import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { console, Math }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['pachinko', 'duel']) vm.runInContext(fs.readFileSync(`src/runtime/sakurayo-${f}.js`, 'utf8'), ctx);
const PK = ctx.SakurayoPachinko, D = ctx.SakurayoDuel, J = x => JSON.parse(JSON.stringify(x));
assert.deepEqual(J(D.simulate({ character: 'rion', seed: 5 })), J(D.simulate({ character: 'rion', seed: 5 })), 'duel deterministic');
const FULL = { spread: { lv: 5, evo: 1 }, pierce: { lv: 5, evo: 1 }, laser: { lv: 5 }, bomb: { lv: 5, evo: 1 }, homing: { lv: 5 }, orbit: { lv: 5 } }, ks = Object.keys(FULL);
const rate = (o, n) => { let w = 0, T = [], c = 0; const C = {}; for (const ch of ['sayo', 'aya', 'rion']) for (let s = 1; s <= n; s++) { const k = ks[s % 6]; const r = D.simulate(Object.assign({ character: ch, seed: s * 31 + (o.layer || 1), skill: 0.75, route: s % 2 ? 'tech' : 'bio', form: { slot: ['base', 'speed', 'burst', 'guard'][s % 4] }, weapons: o.full ? { [k]: FULL[k] } : { [k]: { lv: 2 } } }, o)); w += r.win; T.push(r.time); c = Math.max(c, r.maxCombo); C[ch] = (C[ch] || 0) + r.time; } T.sort((a, b) => a - b); const v = Object.values(C); return { w: w / (3 * n), med: T[T.length >> 1], min: T[0], combo: c, ratio: Math.max(...v) / Math.min(...v) }; };
let rd = 0;
for (let L = 1; L <= 3; L++) {
  const a = rate({ layer: L, power: 1 + 0.3 * L }, 12), b = rate({ layer: L, power: 1 + 0.3 * L, boss: true }, 12);
  assert.ok(a.w >= 0.75, `duel L${L} normal foe win ${a.w.toFixed(2)}`); assert.ok(b.w >= 0.6, `duel L${L} boss (mid build) win ${b.w.toFixed(2)} — 三种 Boss 模式都要能打`);
  assert.ok(a.ratio <= 1.3 && b.ratio <= 1.3, 'char time ratio'); rd = Math.max(rd, a.ratio, b.ratio);
  console.log(`duel L${L}: foe ${a.w.toFixed(2)} (med ${a.med.toFixed(0)}s), boss ${b.w.toFixed(2)} (med ${b.med.toFixed(0)}s), max combo ${Math.max(a.combo, b.combo)}`);
}
{ const f = rate({ layer: 3, power: 2.2, full: true }, 12); assert.ok(f.med >= 25 && f.min >= 12, 'full build vs normal foe still has exchanges: median ' + f.med.toFixed(1)); console.log('duel full build vs normal foe: median', f.med.toFixed(1), 's, min', f.min.toFixed(1));
  const b = rate({ layer: 3, power: 2.2, full: true, boss: true }, 24); assert.ok(b.w >= 0.75 && b.w <= 0.85, 'duel boss full-build win rate ' + b.w.toFixed(3)); console.log('duel boss full-build win rate', b.w.toFixed(3)); }
for (const w of ks) { const r = D.simulate({ character: 'sayo', seed: 3, layer: 1, weapons: { [w]: { lv: 3 } } }); assert.equal(r.special, w, 'build picks the A-special variant'); }
{ // KOF 系统：搓招解析、取消、投/拆投、防御段位
  const g = new D.Game({ character: 'sayo', seed: 1, layer: 1 }); const P = g.P;
  for (const d of [2, 3, 6]) { g.pushDir(P, d); g.frame++; } assert.equal(g.matchCmd(P), 'A', '236 = A'); P.buf.length = 0;
  for (const d of [6, 2, 3]) { g.pushDir(P, d); g.frame++; } assert.equal(g.matchCmd(P), 'D', '623 = DP'); P.buf.length = 0;
  for (const d of [2, 3, 6, 2, 3, 6]) { g.pushDir(P, d); g.frame++; } assert.equal(g.matchCmd(P), 'S', '236236 = super');
  const E = g.E; E.holdDir = 1; E.st = 'crouch'; assert.ok(g.blocks(E, D.MV.lp) && g.blocks(E, D.MV.clp) && !g.blocks(E, D.MV.jhp), 'crouch block: mid/low yes, overhead no');
  E.holdDir = 4; E.st = 'stand'; assert.ok(g.blocks(E, D.MV.jhp) && !g.blocks(E, D.MV.clp), 'stand block: overhead yes, low no');
  P.st = 'move'; P.mv = D.MV.clp; P.mf = 6; P.hit = true; assert.ok(g.canCancel(P, 'sp') && g.canCancel(P, 'n'), 'light normal cancels into special / chains');
}
{ // 樱花弹珠台（抽奖小游戏）：确定性、不卡球、期望收益低于每球价格（不能刷币）、奖品不含战斗属性
  assert.deepEqual(J(PK.simulate(9, 120)), J(PK.simulate(9, 120)), 'pachinko deterministic');
  let ev = 0, jack = 0; for (let s = 1; s <= 300; s++) { const r = PK.simulate(s, 30 + (s * 37) % 300); assert.ok(r.slot != null, 'ball always lands'); ev += (r.prize.coins || 0) + (r.prize.again ? 50 : 0); jack += r.prize.id === 'jack' ? 1 : 0; }
  assert.ok(ev / 300 < PK.COST, 'EV ' + (ev / 300).toFixed(1) + ' < cost'); assert.ok(jack > 0 && jack / 300 < 0.2, 'jackpot rate ' + jack / 300);
  for (const q of PK.PRIZES) assert.deepEqual(Object.keys(q).filter(k => !['id', 'n', 'coins', 'kyo', 'again', 'col'].includes(k)), [], 'prize is currency only');
}
console.log('PASS modes unit: pachinko lottery + KOF duel (commands/cancel/block heights, win rates per layer, boss 75–85%), ratio', rd.toFixed(2));
{ // 路线：弹珠节点已移出夜行地图；路线决定 Boss 推荐模式与遗物池
  vm.runInContext(fs.readFileSync('src/runtime/sakurayo-run.js', 'utf8'), ctx); const R = ctx.SakurayoRun;
  for (let s = 1; s <= 20; s++) { const st = R.create(s, 'sayo', s % 2 ? 'tech' : 'bio'); assert.ok(!JSON.stringify(st.map).includes('"pin"'), 'no pin nodes'); const rp = R.route(st).relics; assert.ok(R.relicOffer(st, 3).every(q => rp.includes(q.id)), 'route relic pool'); }
  assert.equal(R.bossModes(R.create(1, 'aya', 'bio')).find(m => m.rec).k, 'duel'); assert.equal(R.bossModes(R.create(1, 'aya', 'tech')).find(m => m.rec).k, 'sky');
  const old = R.create(3, 'sayo'); delete old.route; old.map[0][1][0].type = 'pin'; const san = R.sanitize(JSON.parse(JSON.stringify(old))); assert.equal(san.route, 'tech'); assert.ok(!JSON.stringify(san.map).includes('"pin"'), 'old save pin → fight');
  console.log('PASS routes: tech/bio relic pools, boss-mode recommendation, pin nodes removed (old saves migrated)');
}

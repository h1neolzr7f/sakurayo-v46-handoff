// 镜弹（弹珠）/ 镜斗（格斗）纯逻辑：确定性、三角色首层必胜、构筑与形态都能生效且能通关、三角色用时比 ≤1.30。
import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { console, Math }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['pachinko', 'duel']) vm.runInContext(fs.readFileSync(`src/runtime/sakurayo-${f}.js`, 'utf8'), ctx);
const PK = ctx.SakurayoPachinko, D = ctx.SakurayoDuel, J = x => JSON.parse(JSON.stringify(x));
assert.deepEqual(J(D.simulate({ character: 'rion', seed: 5 })), J(D.simulate({ character: 'rion', seed: 5 })), 'duel deterministic');
const ratio = (fn, key) => { const T = {}; for (const ch of ['sayo', 'aya', 'rion']) { let s = 0; for (let seed = 1; seed <= 6; seed++) { const r = fn(ch, seed); assert.ok(r.win, `${key} ${ch} seed ${seed} wins layer 1`); s += r[key]; } T[ch] = s / 6; } const v = Object.values(T); return [Math.max(...v) / Math.min(...v), T]; };
const [rd, td] = ratio((ch, seed) => D.simulate({ character: ch, seed, layer: 1 }), 'time');
assert.ok(rd <= 1.3, 'duel time ratio ' + rd.toFixed(2) + JSON.stringify(td));
for (const slot of ['guard', 'speed', 'burst']) for (const w of ['spread', 'bomb', 'laser', 'homing', 'pierce', 'orbit']) {
  const o = { character: 'sayo', seed: 3, layer: 1, form: { slot }, weapons: { [w]: { lv: 3 } } };
  const r = D.simulate(o); assert.ok(r.win, `duel ${slot}/${w}`); assert.equal(r.special, w, 'build picks the special move');
}
{ // 镜斗：满级构筑面对普通对手也要有来回（AI 架防/读招/确反/连段，不靠堆血）
  const full = { spread: { lv: 5, evo: 1 }, pierce: { lv: 5, evo: 1 }, laser: { lv: 5 }, bomb: { lv: 5, evo: 1 }, homing: { lv: 5 }, orbit: { lv: 5 } }, ks = Object.keys(full), T = [];
  for (const ch of ['sayo', 'aya', 'rion']) for (let seed = 1; seed <= 8; seed++) { const k = ks[seed % 6]; const r = D.simulate({ character: ch, seed, layer: 3, power: 2.2, weapons: { [k]: full[k] }, form: { slot: ['speed', 'burst'][seed % 2] } }, 120); T.push(r.time); }
  T.sort((a, b) => a - b); const med = T[T.length >> 1];
  assert.ok(med >= 25, 'duel full-build median length ' + med.toFixed(1) + 's ≥ 25s'); assert.ok(T[0] >= 12, 'no 秒杀: shortest ' + T[0].toFixed(1));
  console.log('duel full build vs normal foe: median', med.toFixed(1), 's, min', T[0].toFixed(1));
}
{ // 镜斗 Boss：前摇提示（红色「!」）+ 连段后「破绽」窗口；满级构筑胜率目标 75–85%
  const full = { spread: { lv: 5, evo: 1 }, pierce: { lv: 5, evo: 1 }, laser: { lv: 5 }, bomb: { lv: 5, evo: 1 }, homing: { lv: 5 }, orbit: { lv: 5 } }, ks = Object.keys(full); let w = 0, n = 0;
  for (const ch of ['sayo', 'aya', 'rion']) for (let seed = 1; seed <= 16; seed++) for (const slot of ['base', 'speed', 'burst', 'guard']) { const k = ks[seed % 6]; w += D.simulate({ character: ch, seed, layer: 3, power: 2.2, boss: true, weapons: { [k]: full[k] }, form: { slot } }, 120).win ? 1 : 0; n++; }
  assert.ok(w / n >= 0.75 && w / n <= 0.85, 'duel boss full-build win rate ' + (w / n).toFixed(3)); console.log('duel boss full-build win rate', (w / n).toFixed(3));
}
{ // 樱花弹珠台（抽奖小游戏）：确定性、不卡球、期望收益低于每球价格（不能刷币）、奖品不含战斗属性
  assert.deepEqual(J(PK.simulate(9, 120)), J(PK.simulate(9, 120)), 'pachinko deterministic');
  let ev = 0, jack = 0; for (let s = 1; s <= 300; s++) { const r = PK.simulate(s, 30 + (s * 37) % 300); assert.ok(r.slot != null, 'ball always lands'); ev += (r.prize.coins || 0) + (r.prize.again ? 50 : 0); jack += r.prize.id === 'jack' ? 1 : 0; }
  assert.ok(ev / 300 < PK.COST, 'EV ' + (ev / 300).toFixed(1) + ' < cost'); assert.ok(jack > 0 && jack / 300 < 0.2, 'jackpot rate ' + jack / 300);
  for (const q of PK.PRIZES) assert.deepEqual(Object.keys(q).filter(k => !['id', 'n', 'coins', 'kyo', 'again', 'col'].includes(k)), [], 'prize is currency only');
}
console.log('PASS modes unit: pachinko lottery + duel deterministic, layer-1 wins, ratio', rd.toFixed(2), 'all forms×builds clear');
{ // 路线：弹珠节点已移出夜行地图；路线决定 Boss 推荐模式与遗物池
  vm.runInContext(fs.readFileSync('src/runtime/sakurayo-run.js', 'utf8'), ctx); const R = ctx.SakurayoRun;
  for (let s = 1; s <= 20; s++) { const st = R.create(s, 'sayo', s % 2 ? 'tech' : 'bio'); assert.ok(!JSON.stringify(st.map).includes('"pin"'), 'no pin nodes'); const rp = R.route(st).relics; assert.ok(R.relicOffer(st, 3).every(q => rp.includes(q.id)), 'route relic pool'); }
  assert.equal(R.bossModes(R.create(1, 'aya', 'bio')).find(m => m.rec).k, 'duel'); assert.equal(R.bossModes(R.create(1, 'aya', 'tech')).find(m => m.rec).k, 'sky');
  const old = R.create(3, 'sayo'); delete old.route; old.map[0][1][0].type = 'pin'; const san = R.sanitize(JSON.parse(JSON.stringify(old))); assert.equal(san.route, 'tech'); assert.ok(!JSON.stringify(san.map).includes('"pin"'), 'old save pin → fight');
  console.log('PASS routes: tech/bio relic pools, boss-mode recommendation, pin nodes removed (old saves migrated)');
}

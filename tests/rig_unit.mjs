// 看板娘 rig：脚底不动（无整图平移）、呼吸/头发/裙摆有位移、眨眼与表情、部位命中、三角色数据齐全。
import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { atob: s => Buffer.from(s, 'base64').toString('latin1'), Math, Float32Array, Uint16Array, Object, Promise };
ctx.globalThis = ctx; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/runtime/sakurayo-rig.js', 'utf8'), ctx);
for (const id of ['sayo', 'aya', 'rion']) {
  const dir = `android-app/app/src/main/assets/game/art/live/${id}/`;
  vm.runInContext(fs.readFileSync(dir + 'rig.js', 'utf8'), ctx);
  const d = ctx.SakurayoRigData[id];
  for (const f of d.v === 2 ? ['rig.js', 'body.webp', 'arms.webp', 'atlas.webp'] : ['rig.js', 'base.webp', 'atlas.webp']) assert.ok(fs.existsSync(dir + f), `${id} ${f}`); assert.deepEqual(Object.keys(d.patches).sort(), ['closed', 'happy', 'shy', 'talk']);
  const r = d.v === 2 ? new ctx.SakurayoRig.Rig2({}, d, { body: { width: d.w, height: d.h }, arms: { width: 1, height: 1 }, atlas: { width: 2000, height: 600 } }, { no3d: true, test: true })
    : new ctx.SakurayoRig.Rig({}, d, { width: d.w, height: d.h }, { width: 2000, height: 600 }, { no3d: true, test: true });
  const m = r.meshes[0], gx = d.grid[0], gy = d.grid[1];
  let maxFoot = 0, maxHead = 0, maxHair = 0, closed = 0;
  const head = (() => { let b = 0, q = 0; for (let i = 0; i < m.n; i++) if (m.w.head[i] > b) { b = m.w.head[i]; q = i; } return q; })();
  r.lookAt(1, 0);
  for (let f = 0; f < 600; f++) {
    r.update(1 / 60);
    for (let i = (gy - 1) * gx; i < gy * gx; i++) maxFoot = Math.max(maxFoot, Math.abs(m.out[i * 2] - m.pos[i * 2]), Math.abs(m.out[i * 2 + 1] - m.pos[i * 2 + 1]));
    maxHead = Math.max(maxHead, Math.abs(m.out[head * 2] - m.pos[head * 2]));
    maxHair = Math.max(maxHair, Math.abs(r.s.hair)); closed = Math.max(closed, r.s.ex.closed);
  }
  assert.ok(maxFoot < 0.5, `${id} feet anchored (${maxFoot})`);
  assert.ok(maxHead > 4, `${id} head turns with depth parallax (${maxHead})`);
  assert.ok(maxHair > 0.05, `${id} hair secondary motion`);
  assert.ok(closed > 0.8, `${id} blinks`);
  const lm = d.landmarks; assert.equal(r.part(lm.head[0], lm.head[1]), 'head'); assert.equal(r.part(lm.chest[0], lm.chest[1]), 'chest');
  r.play('chest'); for (let f = 0; f < 50; f++) r.update(1 / 60); assert.ok(r.s.ex.shy > 0.5, `${id} chest → shy`);
  r.play('stretch'); for (let f = 0; f < 90; f++) r.update(1 / 60); assert.ok(r.s.stretch > 0.5 && r.s.ex.happy > 0.3, `${id} stretch`);
  console.log('ok', id, maxHead.toFixed(1), maxFoot.toFixed(2));
}
console.log('rig_unit ok');

// rig v2：全身层级联动 + 手臂 IK
for (const id of ['sayo', 'aya', 'rion']) {
  const d = ctx.SakurayoRigData[id];
  if (!d || d.v !== 2) continue;
  const R = ctx.SakurayoRig;
  const r = new R.Rig2({}, d, { body: { width: 1, height: 1 }, arms: { width: 1, height: 1 }, atlas: { width: 1, height: 1 } }, { no3d: 1, test: 1 });
  r.lookAt(1, 0); for (let i = 0; i < 6; i++) r.update(1 / 30);
  const L = r.s.lag; if (!(Math.abs(L.neck) > Math.abs(L.chest) && Math.abs(L.chest) > Math.abs(L.waist) && L.waist > 0)) throw new Error(id + ' spine chain should lag head→neck→chest→waist ' + JSON.stringify(L));
  if (d.actions?.pin) { console.log('ok v2', id, 'pin uses keyframe sequence'); continue; }
  const A = d.arms[d.bones.pinSide], m = r.meshes.find(m => m.side === d.bones.pinSide);
  let bi = 0, best = 1e9; for (let q = 0; q < m.n; q++) { const dd = Math.hypot(m.pos[2 * q] - A.Wr[0], m.pos[2 * q + 1] - A.Wr[1]); if (dd < best) { best = dd; bi = q; } }
  const y0 = m.out[2 * bi + 1]; r.play('pin'); for (let i = 0; i < 45; i++) r.update(1 / 30);
  if (!(m.out[2 * bi + 1] < y0 - (A.Wr[1] - d.landmarks.face[1]) * 0.6)) throw new Error(id + ' pin: hand must really lift toward the head');
  console.log('ok v2', id, 'lag', L.neck.toFixed(2), L.chest.toFixed(2), L.waist.toFixed(2), 'wrist', y0.toFixed(0), '->', m.out[2 * bi + 1].toFixed(0));
}

// 大幅动作序列：关键帧+补帧，首尾帧 = 待机（淡入淡出），播放时经过全部帧并最终回到待机
for (const id of ['sayo', 'aya', 'rion']) {
  const d = ctx.SakurayoRigData[id]; if (!d.actions) continue;
  for (const [an, A] of Object.entries(d.actions)) {
    assert.ok(fs.existsSync(`android-app/app/src/main/assets/game/art/live/${id}/act_${an}.webp`), `${id} act_${an}.webp`);
    assert.equal(A.keys[0], 0); assert.ok(A.frames.length >= 9, `${id} ${an} has in-betweens`);
    const fake = { width: 4096, height: 4096 };
    const r = new ctx.SakurayoRig.Rig2({}, d, { body: { width: d.w, height: d.h }, arms: { width: 1, height: 1 }, atlas: { width: 1, height: 1 }, ['act_' + an]: fake }, { no3d: true, test: true });
    r.play(an); const seen = new Set(); let fade0 = null, done = false;
    for (let i = 0; i < 600 && !done; i++) { r.update(1 / 60); const f = r.seqFrame(); if (!f) { done = seen.size > 0; continue; } if (fade0 === null) fade0 = f.fade; seen.add(Math.round(f.pos)); }
    assert.ok(fade0 < 0.2, `${id} ${an} fades in from idle`); assert.ok(done, `${id} ${an} returns to idle`);
    assert.equal(seen.size, A.frames.length, `${id} ${an} plays every frame`);
    console.log('ok seq', id, an, A.frames.length, 'frames');
  }
}

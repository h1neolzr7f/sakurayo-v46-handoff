// 看板娘 rig：脚底不动（无整图平移）、呼吸/头发/裙摆有位移、眨眼与表情、部位命中、三角色数据齐全。
import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { atob: s => Buffer.from(s, 'base64').toString('latin1'), Math, Float32Array, Uint16Array, Object, Promise };
ctx.globalThis = ctx; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/runtime/sakurayo-rig.js', 'utf8'), ctx);
for (const id of ['sayo', 'aya', 'rion']) {
  const dir = `android-app/app/src/main/assets/game/art/live/${id}/`;
  for (const f of ['rig.js', 'base.webp', 'atlas.webp']) assert.ok(fs.existsSync(dir + f), `${id} ${f}`);
  vm.runInContext(fs.readFileSync(dir + 'rig.js', 'utf8'), ctx);
  const d = ctx.SakurayoRigData[id]; assert.deepEqual(Object.keys(d.patches).sort(), ['closed', 'happy', 'shy', 'talk']);
  const r = new ctx.SakurayoRig.Rig({}, d, { width: d.w, height: d.h }, { width: 2000, height: 600 }, { no3d: true, test: true });
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

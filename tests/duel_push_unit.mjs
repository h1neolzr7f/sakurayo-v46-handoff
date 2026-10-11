// ART_PASS ③：MUGEN 式推挤框——双方推挤框在任何一帧都不重叠（跳过头顶除外），贴版边时由另一方承担位移。
import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { console, Math }; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/runtime/sakurayo-duel.js', 'utf8'), ctx);
const D = ctx.SakurayoDuel; let frames = 0, worst = 0;
for (const ch of ['sayo', 'aya', 'rion']) for (let seed = 1; seed <= 6; seed++) {
  const g = new D.Game({ character: ch, seed, layer: 1 + seed % 3, boss: seed % 2 === 0 }); g.auto = true;
  for (let t = 0; t < 2400 && !g.done; t++) { g.frameStep(); if (g.P.st === 'thrown' || g.E.st === 'thrown') continue;
    const a = g.pushBox(g.P), b = g.pushBox(g.E); if (a.bot <= b.top || b.bot <= a.top) continue;
    const ov = Math.min(a.r, b.r) - Math.max(a.l, b.l); worst = Math.max(worst, ov); frames++; }
}
assert.ok(worst <= 0.01, 'pushbox overlap ' + worst);
// 贴版边：P 在左版边，E 压上来 → P 不动，E 被推开
const g = new D.Game({ character: 'sayo', seed: 1 }); g.P.x = 40; g.E.x = 50; g.pushApart();
assert.equal(g.P.x, 40); assert.ok(g.E.x - g.P.x >= D.Game.PUSH.front * 2 - 0.01, 'corner push ' + (g.E.x - g.P.x));
// 完全重合也能分开
g.P.x = g.E.x = 480; g.pushApart(); assert.ok(Math.abs(g.E.x - g.P.x) >= 50);
console.log('PASS duel pushbox: ' + frames + ' frames checked, no overlap; corner + coincident cases');

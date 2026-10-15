// SakurayoForms pure logic: 15 forms, offers, per-layer switch limit, boss switches, awaken gauge/timer, mods, compat, sanitize.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
createRequire(import.meta.url)('../src/runtime/sakurayo-forms.js');
const F = globalThis.SakurayoForms;
assert.equal(F.FORMS.length, 15);
for (const ch of ['sayo', 'aya', 'rion']) {
  assert.deepEqual(F.list(ch).map(f => f.slot), ['base', 'guard', 'speed', 'burst', 'awaken']);
  const st = { character: ch, layer: 1 }; F.init(st);
  assert.equal(st.form.id, ch + '_base'); assert.deepEqual(F.mods(st, 0), {}, 'base form has no rule mods');
  const off = F.offer(st); assert.equal(off.length, 3); assert.ok(off.every(f => f.ch === ch && f.slot !== 'awaken'));
  assert.ok(F.switchTo(st, ch + '_guard', 'node'), 'first node switch ok');
  assert.equal(F.canSwitch(st, ch + '_speed', 'node'), false, 'one node switch per layer');
  assert.ok(F.switchTo(st, ch + '_burst', 'boss'), 'boss-phase switch does not count');
  st.layer = 2; assert.ok(F.canSwitch(st, ch + '_speed', 'node'), 'new layer resets');
  assert.equal(F.canSwitch(st, ch + '_awaken', 'boss'), false, 'awaken is not switchable');
  assert.ok(F.offer(st).some(f => f.slot === 'base'), 'can go back to base');
  // awaken
  assert.equal(F.awaken(st, 4, 10), false, 'empty gauge');
  F.charge(st, 0, 4); assert.equal(st.form.gauge, F.GAUGE_MAX);
  assert.equal(F.awaken(st, 3, 10), false, 'needs boss phase 4');
  assert.ok(F.awaken(st, 4, 10)); assert.equal(F.active(st, 12).slot, 'awaken'); assert.equal(F.active(st, 10 + F.AWAKEN_SEC + .01).slot, 'burst');
  assert.ok(F.mods(st, 12).dmg > 1); const P = {}; F.apply(P, st, 12); assert.equal(P.form46.id, ch + '_awaken');
  // sanitize
  const s = F.sanitize(JSON.parse(JSON.stringify(st.form)), ch); assert.equal(s.awakenUntil, 0); assert.equal(s.id, ch + '_burst');
  assert.equal(F.sanitize({ id: 'nope' }, ch), null); assert.equal(F.sanitize({ id: ch + '_awaken' }, ch), null);
}
// compat / generalize
const st = { character: 'sayo', layer: 1 }; const r = F.switchTo(st, 'sayo_speed', 'node', ['orbit', 'spread']);
assert.deepEqual(r.generalized, ['orbit']); assert.equal(F.compatible(st, 'orbit'), false); assert.equal(F.compatible(st, 'spread'), true);
// character mismatch resets to own base
const x = { character: 'aya', form: { id: 'sayo_guard' } }; F.init(x); assert.equal(x.form.id, 'aya_base');
// mods never reference cosmetics
for (const f of F.FORMS) for (const k of Object.keys(f.mods)) assert.ok(!/skin|cos|art/i.test(k));
console.log('PASS forms unit: 15 forms, offers, switch limits, awaken gauge/timer, mods, compat, sanitize');

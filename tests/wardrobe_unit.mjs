import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { console, Math, Date }; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('src/runtime/sakurayo-wardrobe.js', 'utf8'), ctx);
const W = ctx.SakurayoWardrobe;
assert.equal(W.list('prism').length, 15); assert.equal(W.list('legend').length, 15); assert.equal(W.list('weapon').length, 12); assert.equal(W.list('fx').length, 6);
for (const q of W.ITEMS) if (q.art) assert.ok(fs.existsSync('android-app/app/src/main/assets/game/art/' + q.art), 'art exists ' + q.art);
// 不含任何战斗属性字段
const COMBAT = ['dmg', 'hp', 'maxHp', 'atk', 'fireRate', 'moveSpeed', 'crit', 'def', 'mods', 'speed', 'luck'];
for (const q of W.ITEMS) for (const k of COMBAT) assert.ok(!(k in q), `${q.id} has no combat field ${k}`);
const w = W.blank(), save = { coins: 10000 };
assert.equal(W.buy(w, save, 'prism_sayo_guard').ok, true); assert.equal(save.coins, 9400);
assert.equal(W.buy(w, save, 'prism_sayo_guard').why, '已拥有');
assert.match(W.buy(w, save, 'legend_sayo_burst').why, /使用该形态 3 局/);
for (let i = 0; i < 3; i++) W.noteFormUse(w, 'sayo_burst');
assert.match(W.buy(w, save, 'legend_sayo_burst').why, /镜屑不足/);
// 镜屑周上限
const t0 = Date.UTC(2026, 9, 12); let got = 0; for (let i = 0; i < 20; i++) got += W.gainKyo(w, 'boss', t0);
assert.equal(got, 120, 'weekly cap'); assert.equal(W.gainKyo(w, 'boss', t0 + 7 * 86400000), 20, 'next week resets');
assert.equal(W.buy(w, save, 'legend_sayo_burst').ok, true); assert.equal(w.kyo, 20); assert.equal(save.coins, 4900);
const lk = W.look(w, 'sayo', 'sayo_burst'); assert.ok(lk.art && lk.ult && lk.tint, 'legend look');
assert.equal(W.look(w, 'sayo', 'sayo_guard').tint, W.get('prism_sayo_guard').tint);
assert.deepEqual(JSON.parse(JSON.stringify(W.look(w, 'aya', 'aya_guard'))), {}, 'other character unaffected');
// sanitize：垃圾/未拥有装备被丢弃，合法存档往返不变
const dirty = { owned: ['prism_sayo_guard', 'nope', 'prism_sayo_guard'], equip: { form: { sayo_guard: 'prism_sayo_guard', aya_base: 'legend_aya_base' }, weapon: { sayo: 'weapon_aya_0' }, fx: 'fx_9' }, kyo: -5, formUses: { hacker_x: 9, sayo_base: 2 } };
const s = W.sanitize(dirty); assert.deepEqual(s.owned, ['prism_sayo_guard']); assert.deepEqual(Object.keys(s.equip.form), ['sayo_guard']); assert.deepEqual(JSON.parse(JSON.stringify(s.equip.weapon)), {}); assert.equal(s.equip.fx, null); assert.equal(s.kyo, 0); assert.deepEqual(JSON.parse(JSON.stringify(s.formUses)), { sayo_base: 2 });
assert.deepEqual(JSON.parse(JSON.stringify(W.sanitize(JSON.parse(JSON.stringify(w))))), JSON.parse(JSON.stringify(w)), 'roundtrip');
assert.deepEqual(JSON.parse(JSON.stringify(W.sanitize(undefined))), JSON.parse(JSON.stringify(W.blank())), 'old saves get blank wardrobe');
console.log('PASS wardrobe unit: 48 items, visual-only, legend gates (uses + 镜屑), weekly cap, sanitize/roundtrip');

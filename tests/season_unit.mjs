import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { Math, Date }; ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync('src/runtime/sakurayo-season.js', 'utf8'), ctx);
const S = ctx.SakurayoSeason, J = x => JSON.parse(JSON.stringify(x));
const t0 = new Date(2026, 9, 11, 12).getTime(), DAY = 86400000;
assert.equal(S.seasonOf(new Date(2026, 9, 9, 1).getTime()), 1, 'season 1 starts 2026-10-09');
const s = S.blank(t0), save = { coins: 0 };
// 深渊：逐级解锁，倍率单调
assert.ok(S.canAbyss(s, 1) && !S.canAbyss(s, 2)); S.clearAbyss(s, 1); assert.equal(s.abyssMax, 2); assert.ok(S.canAbyss(s, 3));
assert.ok(S.abyss(10).hp > S.abyss(3).hp && S.abyss(10).coins === 2.5 && S.abyss(0).hp === 1);
// 赛季经验 + 领取
for (let i = 0; i < 25; i++) S.addXp(s, 'boss', t0); // 750 xp → lv 7
assert.equal(S.level(s), 7); let r = S.claim(s, save); assert.equal(r.coins, 60 * 6 + 300); assert.equal(save.coins, 660); assert.equal(S.claim(s, save).coins, 0, 'no double claim');
for (let i = 0; i < 200; i++) S.addXp(s, 'runWin', t0); assert.equal(S.level(s), 40); r = S.claim(s, save); assert.deepEqual(J(r.titles), ['夜店常客', '百夜行者', '大食切的朋友', '千夜一闪']);
// 全赛季樱花币总量（防通胀）：40 级共 32×60+8×300 = 4320
assert.equal(save.coins, 4320);
// 新赛季：经验清零，称号与深渊保留
S.addXp(s, 'node', t0 + 28 * DAY); assert.equal(s.season, 2); assert.equal(s.xp, 10); assert.equal(s.titles.length, 4); assert.equal(s.abyssMax, 2);
// 每日挑战：同日同种子、次日不同；每日一次
const d1 = S.daily(t0), d1b = S.daily(t0 + 3600000), d2 = S.daily(t0 + DAY);
assert.deepEqual(J(d1), J(d1b)); assert.notEqual(d1.seed, d2.seed);
assert.equal(S.finishDaily(s, save, 1, t0), 0, 'must reach layer 2'); assert.equal(S.finishDaily(s, save, 2, t0), 300); assert.equal(S.finishDaily(s, save, 4, t0), 0, 'once per day'); assert.equal(S.finishDaily(s, save, 2, t0 + DAY), 300);
// sanitize
const z = S.sanitize({ abyssMax: 99, xp: 1e9, season: S.seasonOf(t0), claimed: -3, titles: ['a', 'a', 5] }, t0); assert.equal(z.abyssMax, 10); assert.equal(z.xp, 4000); assert.equal(z.claimed, 0); assert.deepEqual(J(z.titles), ['a']);
assert.equal(S.sanitize({ season: 1, xp: 500 }, t0 + 40 * DAY).xp, 0, 'old season xp dropped');
assert.deepEqual(J(S.sanitize(undefined, t0)), J(S.blank(t0)));
console.log('PASS season unit: abyss unlocks, season xp/claim (4320 coins cap), reset keeps titles, daily seed/once, sanitize');

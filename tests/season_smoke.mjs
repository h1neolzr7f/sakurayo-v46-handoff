// 长线：夜行入口（常夜/深渊/每日/百夜行纪）、深渊敌人生命倍率、每日挑战指定角色与词条、行纪经验领取、存档往返。
import assert from 'node:assert/strict'; import path from 'node:path'; import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
await ctx.addInitScript(() => { if (!localStorage.getItem('ss46seed')) { localStorage.setItem('ss46seed', '1'); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 100, unlock: 4, done: [1, 2, 3], tutorialDone: true })); } });
const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
let s = await api('seasonState46'); assert.equal(s.abyssMax, 0); assert.equal(s.level, 0);
await page.click('#runBtn46'); await page.locator('#night46 .nc').first().waitFor();
assert.equal(await page.locator('#night46 .nc').count(), 3, 'three entry cards');
assert.ok(await page.locator('#night46 [data-na="1"]').isDisabled(), 'abyss 1 locked before first clear');
await page.screenshot({ path: '/tmp/sy/night-entry.png' });
assert.equal(await api('abyssStart46', 2), null, 'cannot skip tiers');
// 常夜开局 = 倍率 1；每日挑战固定深渊级 → 倍率放大
await page.locator('#night46 [data-nx]').click();
const unlocked = await page.evaluate(() => { const a = window.__SAKURAYO_TEST__; const st = a.seasonState46(); return st.abyssMax; });
assert.equal(unlocked, 0);
let r = await api('abyssStart46', 0); assert.equal(r.abyss, 0);
let st = await api('runState46'); await api('runEnter46', st.available[0].id); assert.equal(await api('abyssMul46'), 1, 'normal night = ×1');
await api('backMenu').catch(() => {});
await page.evaluate(() => { window.__SAKURAYO_TEST__.seasonXp46('runWin', 1); });
// 每日挑战：角色与词条由日期决定
s = await api('seasonState46'); r = await api('dailyStart46'); assert.equal(r.character, s.daily.character); assert.equal(r.daily.mod, s.daily.mod.id);
st = await api('runState46'); await api('runEnter46', st.available[0].id);
const mul = await api('abyssMul46'); assert.ok(Math.abs(mul - (1 + 0.12 * s.daily.abyss) * (s.daily.mod.id === 'giant' ? 1.25 : 1)) < 1e-9, 'daily runs at abyss ' + s.daily.abyss + ' → ×' + mul);
await api('backMenu').catch(() => {});
// 行纪：经验与领取
await api('seasonXp46', 'boss', 12); s = await api('seasonState46'); assert.ok(s.level >= 4, 'season level ' + s.level);
const c0 = s.coins; const cl = await api('seasonClaim46'); assert.ok(cl.coins >= 240); s = await api('seasonState46'); assert.equal(s.coins, c0 + cl.coins); assert.equal(s.claimed, s.level);
await page.click('#runBtn46').catch(() => {}); if (await page.locator('#night46').isVisible().catch(() => false)) await page.screenshot({ path: '/tmp/sy/night-entry2.png' });
await page.waitForFunction(() => (localStorage.getItem('sakurayoV3') || '').includes('"season46"'), null, { timeout: 5000 });
const re = await api('rebootSave46'); assert.equal(re.season46.claimed, s.claimed, 'season persists'); assert.ok(re.run46?.daily, 'daily run persists');
assert.deepEqual(errors, []); await browser.close();
console.log('PASS season: entry cards, abyss gating + HP multiplier, daily (character/mod/abyss), season xp/claim, persistence');

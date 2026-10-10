// 衣橱：大厅入口、购买/装备、镜屑周上限、存档往返、外观不改变任何战斗数值、旧存档兼容。
import assert from 'node:assert/strict'; import path from 'node:path'; import { pathToFileURL } from 'node:url'; import { chromium } from 'playwright';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
await ctx.addInitScript(() => { if (!localStorage.getItem('wd46seed')) { localStorage.setItem('wd46seed', '1'); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 20000, unlock: 4, done: [1, 2, 3], tutorialDone: true })); } });
const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
const url = pathToFileURL(path.resolve(target)).href + '?test=1';
await page.goto(url); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
let w = await api('wardrobeState46'); assert.ok(w && Array.isArray(w.owned) && w.owned.length === 0, 'legacy save → blank wardrobe');
await page.locator('#wdBtn46').click(); await page.locator('#wd46 .wdc').first().waitFor();
assert.equal(await page.locator('#wd46 .wdc').count(), 5, '5 prism items for current character');
await page.screenshot({ path: '/tmp/sy/wardrobe-prism.png' });
// 基线战斗数值
await api('selectStage', 1); await api('start'); await api('dismissDialogue');
const before = await api('playerStats46'); await api('backMenu').catch(() => {});
let r = await api('wardrobeAct46', 'prism_sayo_base'); assert.ok(r.ok); r = await api('wardrobeAct46', 'weapon_sayo_2'); assert.ok(r.ok); r = await api('wardrobeAct46', 'fx_3'); assert.ok(r.ok);
w = await api('wardrobeState46'); assert.equal(w.coins, 20000 - 600 - 900 - 1200); assert.ok(w.look.bullet && w.look.spark && w.look.tint, 'look applied');
await api('selectStage', 1); await api('start'); await api('dismissDialogue');
const after = await api('playerStats46');
for (const k of ['dmg', 'maxHp', 'speed', 'crit', 'fireRate']) assert.equal(after[k], before[k], 'cosmetics do not change ' + k);
// 传说门槛
r = await api('wardrobeAct46', 'legend_sayo_burst'); assert.equal(r.ok, false); assert.match(r.why, /3 局/);
let g = 0; for (let i = 0; i < 10; i++) g += await api('kyoGain46', 'boss'); assert.equal(g, 120, 'weekly 镜屑 cap');
await page.locator('#wd46 [data-wdt="legend"]').click().catch(() => {}); await api('openWardrobe46', 'legend'); await page.screenshot({ path: '/tmp/sy/wardrobe-legend.png' });
// 存档往返
await page.waitForFunction(() => (localStorage.getItem('sakurayoV3') || '').includes('"weapon_sayo_2"'), null, { timeout: 5000 });
await page.waitForFunction(() => (localStorage.getItem('sakurayoV3') || '').includes('"kyo":120'), null, { timeout: 5000 });
const re = await api('rebootSave46'); assert.ok(re.cosmetics46.owned.includes('fx_3') && re.cosmetics46.equip.weapon.sayo === 'weapon_sayo_2' && re.cosmetics46.kyo === 120, 'wardrobe persists through boot load');
assert.deepEqual(errors, []); await browser.close();
console.log('PASS wardrobe: lobby entry, buy/equip, visual-only (stats unchanged), legend gate, 镜屑 cap, persistence');

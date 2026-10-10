// Build cards: rarity frames, Lv dots, evolution requirement text, evolution + codex persistence.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
// 种子只写一次：用 localStorage 自身做标记（file:// 下 reload 偶发丢 sessionStorage → 旧写法会把种子存档重新盖回去，表现为“图鉴解锁没保存”）
await ctx.addInitScript(() => { if (!localStorage.getItem('b46seed')) { localStorage.setItem('b46seed', '1'); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 4, done: [1, 2, 3], tutorialDone: true })); } });
const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
const url = pathToFileURL(path.resolve(target)).href + '?test=1';
await page.goto(url); await page.locator('.bootArt35').waitFor({ state: 'detached' });
const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
await api('selectStage', 2); await api('start'); await api('dismissDialogue'); await api('protectPlayer');
for (let i = 0; i < 4; i++) await api('takeUpgrade46', 'w_spread');
let r = await api('takeUpgrade46', 'w_spread');
assert.equal(r.weapons.spread.lv, 5); assert.ok(!r.weapons.spread.evo, 'Lv5 alone does not evolve');
r = await api('takeUpgrade46', 'multi');
assert.equal(r.weapons.spread.evo, true, 'partner unlocks evolution'); assert.deepEqual(r.evo, ['spread']);
// card frames: trigger a level-up and inspect cards
await api('takeUpgrade46', 'w_bomb'); await api('takeUpgrade46', 'w_bomb'); await api('takeUpgrade46', 'w_bomb'); await api('takeUpgrade46', 'w_bomb'); await api('takeUpgrade46', 'blast');
let evoCard = null;
for (let k = 0; k < 25 && !evoCard; k++) {
  await api('triggerUpgrade');
  const cards = await api('cardHtml46');
  for (const c of cards) assert.match(c.cls, /rar46-(common|rare|epic|legend|evo)/, 'every card has a rarity frame');
  for (const c of cards) assert.match(c.text, /普通|稀有|史诗|传说|进化|职业|唯一/, 'rarity label is localized');
  evoCard = cards.find(c => c.id === 'w_bomb');
  await api('chooseUpgrade', 0);
}
assert.ok(evoCard, 'bomb card offered'); assert.match(evoCard.cls, /rar46-evo/); assert.match(evoCard.text, /八重爆樱/); assert.match(evoCard.text, /进化条件/);
const codex = await api('openEvoCodex46');
assert.equal(codex.total, 7); assert.ok(codex.seen >= 1);
assert.match(await page.locator('#evoCodex46').innerText(), /百花缭乱/);
await page.waitForFunction(() => (localStorage.getItem('sakurayoV3') || '').includes('"evo46":["spread"'), null, { timeout: 5000 }); await page.waitForTimeout(800); await page.waitForFunction(() => (localStorage.getItem("sakurayoV3") || "").includes("\"evo46\":[\"spread\""), null, { timeout: 5000 });
// 持久化验证：存档已写入 localStorage 后，用启动时同一条读档管线（bootLoadSave）从存储重新读档。
// 不用 page.reload()：高负载下 Chromium 会丢弃渲染进程尚未提交到浏览器进程的 localStorage 写入
// （5 并发复现 3/5 读回种子存档，连新开的同源页面也读不到），那是测试环境的进程竞争，不是游戏存档逻辑的问题。
{ const re = await api('rebootSave46'), ls = await page.evaluate(() => (JSON.parse(localStorage.getItem('sakurayoV3') || '{}').evo46));
  assert.ok(re.evo46.includes('spread'), `codex unlock persists through boot load (reloaded ${JSON.stringify(re.evo46)}, storage ${JSON.stringify(ls)})`); }
await browser.close();
assert.deepEqual(errors, []);
console.log('PASS build: evolution needs Lv5+partner, rarity frames/labels, evolution card, codex persists');

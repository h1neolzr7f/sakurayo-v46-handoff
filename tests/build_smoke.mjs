// Build cards: rarity frames, Lv dots, evolution requirement text, evolution + codex persistence.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('b46')) { sessionStorage.setItem('b46', 1); localStorage.setItem('sakurayoV3', JSON.stringify({ coins: 0, unlock: 4, done: [1, 2, 3], tutorialDone: true })); } });
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
await page.reload(); await page.locator('.bootArt35').waitFor({ state: 'detached' });
assert.deepEqual((await api('saveSnapshot')).evo46.includes('spread'), true, 'codex unlock persists');
await browser.close();
assert.deepEqual(errors, []);
console.log('PASS build: evolution needs Lv5+partner, rarity frames/labels, evolution card, codex persists');

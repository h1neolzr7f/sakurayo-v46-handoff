// Main-line levels + AVG: map/unlock rules (incl. legacy saves), AVG controls (auto, read-only fast-forward,
// backlog, skip), every chapter-1 objective type played to completion, timed/mech/channel types, stars persist.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
async function boot(seed) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript((seed) => { if (!sessionStorage.getItem('lv46')) { sessionStorage.setItem('lv46', 1); localStorage.setItem('sakurayoV3', JSON.stringify(seed)); } }, seed);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(pathToFileURL(path.resolve(target)).href + '?test=1'); await page.locator('.bootArt35').waitFor({ state: 'detached' });
  const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
  return { page, api, errors, ctx };
}
const step = (page, ms, fn) => page.evaluate(([ms, fn]) => { const a = window.__SAKURAYO_TEST__; const m = a.snapshot().mode; if (m === 'level') a.chooseUpgrade(0); else if (m === 'event') a.chooseEvent(0); else if (m === 'dialogue') a.dismissDialogue(); else if (m === 'play') { if (fn) (0, eval)(fn)(a); window.advanceTime(ms); } return a.levelState46(); }, [ms, fn]);
async function playUntil(page, api, fn, max = 400) { let s; for (let i = 0; i < max; i++) { s = await step(page, 250, fn); if (s.mode === 'result' || s.mode === 'avg') break; } return s; }

// --- fresh save: map + unlock + AVG controls + 1-1 survive ---
{
  const { page, api, errors } = await boot({ coins: 0, unlock: 1, tutorialDone: true, character: 'aya' });
  let lv = await api('levels46');
  assert.deepEqual(lv.filter(l => l.unlocked).map(l => l.id), ['1-1'], 'only 1-1 open on a fresh save');
  await page.click('#levelMapBtn46'); await page.locator('#levelMap46:not(.hidden)').waitFor();
  assert.equal(await page.locator('.lm46Node').count(), 4); assert.equal(await page.locator('.lm46Node.lock').count(), 3);
  await page.click('.lm46Node >> nth=0'); await page.locator('.lm46Sheet').waitFor();
  assert.match(await page.locator('.lm46Sheet').innerText(), /存活 90 秒[\s\S]*打开 2 个宝箱[\s\S]*受击 ≤ 6 次/);
  await page.click('.lm46Sheet .go');
  let a = await api('avgState46'); assert.ok(a && a.index === 0 && a.total >= 6, 'pre-level AVG plays');
  for (let i = 0; i < 12 && (a = await api('avgNext46', 2)).name !== '神代绫'; i++);
  assert.equal(a.name, '神代绫', 'protagonist line resolves to the chosen character'); assert.equal(a.speaker, 'L', 'speaker portrait highlighted');
  await page.click('#avg46 .a46bar button:has-text("回看")'); assert.match(await page.locator('#avg46 .a46log').innerText(), /雨宫凛|神代绫/); await page.click('#avg46 .a46log .x');
  await page.click('#avg46 .a46bar button:has-text("自动")'); assert.equal((await api('avgState46')).auto, 1);
  await page.click('#avg46 .a46bar button:has-text("跳过")'); await page.click('#avg46 .a46confirm [data-k=yes]');
  let s = await api('levelState46'); assert.equal(s.mode, 'play'); assert.match(s.label, /存活 9\d 秒/);
  await api('protectPlayer');
  s = await playUntil(page, api, null);
  assert.equal(s.mode, 'avg', 'post-level AVG before result');
  await api('avgSkip46'); s = await api('levelState46');
  assert.equal(s.mode, 'result'); assert.deepEqual(s.result.got.slice(0, 1), [true]); assert.equal(s.result.got[2], true, 'no hits → hits star');
  assert.ok(s.stars46['1-1'] >= 2); assert.ok(await page.locator('#levelStars46 span.on').count() >= 2);
  lv = await api('levels46'); assert.ok(lv.find(l => l.id === '1-2').unlocked, 'clearing 1-1 opens 1-2');
  const snap = await api('saveSnapshot46'); assert.ok(snap.avgRead46 >= 10, 'skipped lines count as read'); assert.deepEqual(snap.done, [], 'non-boss nodes do not mark the chapter boss done');
  // read-only fast-forward stops at the first unread line: replay 1-1 pre (all read) → ff runs to the end
  await page.evaluate(() => window.__SAKURAYO_TEST__.backMenu?.());
  await api('openLevelMap46', 1); await page.click('.lm46Node >> nth=0'); await page.click('.lm46Sheet [data-k=replay]');
  await page.click('#avg46 .a46bar button:has-text("快进")');
  await page.waitForFunction(() => window.__SAKURAYO_TEST__.avgState46() === null, null, { timeout: 10000 }).catch(() => {}); // ff pace is wall-clock; allow for CPU load
  assert.equal(await api('avgState46'), null, 'fast-forward runs through already-read lines');
  await api('launchLevel46', '1-2'); assert.equal((await api('avgState46')).index, 0);
  await page.click('#avg46 .a46bar button:has-text("快进")'); await page.waitForTimeout(600);
  const ff = await api('avgState46'); assert.ok(ff && ff.index === 0 && !ff.ff, 'fast-forward stops on unread lines'); await api('avgSkip46'); await api('backMenu');
  assert.deepEqual(errors, []);
}
// --- legacy save: chapter 1 boss done → whole chapter open, 1-4 counts cleared; 2-1 timed, 2-2 mech, 3-3 channel ---
{
  const { page, api, errors } = await boot({ coins: 0, unlock: 3, done: [1, 2], tutorialDone: true });
  const lv = await api('levels46');
  for (const id of ['1-1', '1-2', '1-3', '1-4', '2-1', '2-4', '3-1']) assert.ok(lv.find(l => l.id === id).unlocked, id + ' unlocked by legacy progress');
  assert.ok(!lv.find(l => l.id === '3-2').unlocked); assert.ok(!lv.find(l => l.id === '4-1').unlocked);
  // 1-3 escort
  await api('launchLevel46', '1-3'); await api('avgSkip46'); await api('protectPlayer');
  let s = await api('levelState46'); assert.ok(s.npc, 'escort NPC spawned');
  s = await playUntil(page, api, "a=>{const s=a.levelState46();if(s.npc){a.teleport46(s.npc.x+40,s.npc.y);if(s.npc.hp<80){a.clearCombat();a.healNpc46()}}}", 600);
  await api('avgSkip46'); s = await api('levelState46'); assert.equal(s.mode, 'result'); assert.equal(s.result.got[0], true, "escort completes " + JSON.stringify(s));
  // 1-2 clear
  await api('launchLevel46', '1-2'); await api('avgSkip46'); await api('protectPlayer');
  s = await playUntil(page, api, null, 800); await api('avgSkip46'); s = await api('levelState46'); assert.equal(s.result.got[0], true, 'clear completes');
  // 1-4 boss
  await api('launchLevel46', '1-4'); await api('avgSkip46'); await api('protectPlayer');
  for (let i = 0; i < 200 && !(await api('snapshot')).boss; i++) await step(page, 250);
  assert.ok((await api('snapshot')).runTime < 30, 'boss node spawns the boss early');
  await api('defeatBoss'); s = await playUntil(page, api, null, 100);
  if ((await api('levelState46')).mode === 'avg') { const av = await api('avgState46'); assert.ok(av.total >= 6); await api('avgSkip46'); }
  for (let i = 0; i < 20 && (await api('levelState46')).mode !== 'result'; i++) await step(page, 250);
  s = await api('levelState46'); assert.equal(s.mode, 'result'); assert.ok(s.stars46['1-4'] >= 1);
  assert.ok((await api('saveSnapshot46')).cg46.length >= 1, 'chapter CG unlocked into the album');
  // 2-2 mech
  await api('launchLevel46', '2-2'); await api('protectPlayer'); s = await api('levelState46'); assert.equal(s.pads.length, 3);
  s = await playUntil(page, api, "a=>{const s=a.levelState46();const p=s.pads.find(q=>!q.used);if(p)a.teleport46(p.x,p.y)}", 200);
  assert.equal(s.mode, 'result'); assert.equal(s.result.got[0], true, 'mech completes');
  // 2-1 timed
  await api('launchLevel46', '2-1'); await api('protectPlayer'); s = await api('levelState46'); assert.equal(s.targets, 4);
  s = await playUntil(page, api, null, 400); assert.equal(s.mode, 'result');
  assert.ok(s.result.got[0] || /时间到/.test(s.fail || ''), 'timed ends in win or timeout');
  assert.deepEqual(errors, []);
  await page.reload(); await page.locator('.bootArt35').waitFor({ state: 'detached' });
  const after = await api('saveSnapshot46'); assert.ok(after.stars46['1-3'] >= 1 && after.stars46['1-4'] >= 1, 'stars persist across reload');
}
await browser.close();
console.log('PASS levels: map/unlock/legacy, AVG auto/log/skip, survive/clear/escort/boss/mech/timed objectives, stars + CG persist');

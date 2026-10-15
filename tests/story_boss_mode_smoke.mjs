// 主线 Boss 关三选一（割草 / 格斗 / 弹幕）：关卡详情里能选、默认推荐、三种都能进入并正确结算
// （星级、解锁下一章、post 剧情）；1024×461 横屏下详情面板不滚动、不遮挡。见 ERROR_LEDGER E-STORY-BOSSMODE。
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const target = process.argv[2] || 'src/index.html';
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const url = pathToFileURL(path.resolve(target)).href + '?test=1';
const seed = { coins: 0, unlock: 1, done: [], tutorialDone: true, stars46: { '1-1': 1, '1-2': 1, '1-3': 1 }, character: 'sayo' };
const errors = [];
async function fresh(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript((seed) => { if (!sessionStorage.getItem('sbm')) { sessionStorage.setItem('sbm', 1); localStorage.setItem('sakurayoV3', JSON.stringify(seed)); } }, seed);
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(String(e)));
  await page.goto(url); await page.locator('.bootArt35').waitFor({ state: 'detached' });
  const api = (fn, ...a) => page.evaluate(([fn, a]) => window.__SAKURAYO_TEST__[fn](...a), [fn, a]);
  return { ctx, page, api };
}
const skipAvg = async (api) => { for (let i = 0; i < 6; i++) { const a = await api('avgState46'), s = await api('levelState46'); if (!a && s.mode !== 'avg') return s; await api('avgSkip46'); } return api('levelState46'); };

// 1) 入口：关卡详情（1024×461），默认选中推荐项，无滚动/遮挡
{
  const { ctx, page, api } = await fresh(1024, 461);
  await page.click('#levelMapBtn46'); await page.locator('#levelMap46:not(.hidden)').waitFor();
  await page.locator('#levelMap46 .lm46Node', { hasText: '1-4' }).click();
  const picker = page.locator('#levelMap46 .lm46Sheet .sbm46');
  await picker.waitFor();
  assert.equal(await picker.locator('button').count(), 3, 'three boss modes offered');
  const on = await picker.locator('button.on').getAttribute('data-v');
  const rec = await picker.locator('button.rec').getAttribute('data-v');
  assert.equal(on, rec, 'recommended mode is selected by default');
  const fit = await page.evaluate(() => { const sh = document.querySelector('#levelMap46 .lm46Sheet'), r = sh.getBoundingClientRect(), go = sh.querySelector('.go').getBoundingClientRect();
    const btns = [...sh.querySelectorAll('.sbm46 button, .row button')].map(b => b.getBoundingClientRect());
    const overlap = btns.some((a, i) => btns.some((b, j) => i < j && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom));
    return { scroll: sh.scrollHeight - sh.clientHeight, bottom: r.bottom, goBottom: go.bottom, h: innerHeight, overlap, docScroll: document.documentElement.scrollHeight - innerHeight }; });
  assert.ok(fit.scroll <= 1 && fit.docScroll <= 1, 'sheet must not scroll at 1024x461 ' + JSON.stringify(fit));
  assert.ok(fit.goBottom <= fit.h && fit.bottom <= fit.h, '出击 visible ' + JSON.stringify(fit));
  assert.equal(fit.overlap, false, 'mode chips / buttons do not overlap');
  await picker.locator('button[data-v="duel"]').click();
  assert.equal(await page.locator('#levelMap46 .sbm46 button.on').getAttribute('data-v'), 'duel', 'selection switches');
  fs.mkdirSync('tests/screenshots', { recursive: true });
  await page.screenshot({ path: 'tests/screenshots/story-boss-mode-1024x461.png' });
  assert.equal(await api('storyBossMode46', '1-4'), 'duel', 'selection saved');
  console.log('PASS story boss mode picker: 3 options, recommended default, fits 1024x461 without scroll');
  await ctx.close();
}

// 2) 三种模式都能进入并完成结算
for (const mode of ['mow', 'sky', 'duel']) {
  const { ctx, page, api } = await fresh(1280, 720);
  await api('storyBossSet46', '1-4', mode);
  await api('launchLevel46', '1-4');
  let s = await skipAvg(api);
  if (mode === 'mow') {
    assert.equal(s.mode, 'play', 'mow enters the normal battle');
    await api('protectPlayer'); await api('finishNow46', true);
  } else {
    const b = await api('storyBoss46');
    assert.ok(b.running && b.kind === mode, `${mode} mode launched ` + JSON.stringify(b));
    await api('skyStep46', 1);
    await api('storyBossEnd46', true);
    assert.equal((await api('storyBoss46')).alt.mode, mode);
  }
  s = await skipAvg(api);
  assert.equal(s.mode, 'result', `${mode}: reaches result`);
  assert.ok(s.result && s.result.got[0] === true && s.stars46['1-4'] >= 1, `${mode}: win star recorded ` + JSON.stringify(s.result));
  const sv = await api('saveSnapshot46');
  assert.ok(sv.done.includes(1) && sv.unlock >= 2, `${mode}: chapter 1 done, chapter 2 unlocked ` + JSON.stringify([sv.done, sv.unlock]));
  assert.ok(await page.locator('#result').isVisible(), `${mode}: result shown`);
  assert.match(await page.locator('#rtitle').innerText(), /1-4/);
  if (mode !== 'mow') { // 再次迎击回到同一模式
    await page.locator('#again').click(); await skipAvg(api);
    const b = await api('storyBoss46'); assert.ok(b.running && b.kind === mode, `${mode}: again relaunches same mode`);
    await api('storyBossEnd46', false); s = await skipAvg(api); assert.equal(s.mode, 'result');
  }
  await page.locator('#back').click();
  console.log(`PASS story boss ${mode}: enters, settles stars/unlock/story`);
  await ctx.close();
}
assert.deepEqual(errors, [], 'no page errors');
await browser.close();
console.log('PASS story boss mode smoke');

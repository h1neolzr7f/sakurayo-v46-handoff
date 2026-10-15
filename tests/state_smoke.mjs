import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=process.env.SAKURAYO_ENTRY||process.argv[2]||'src/index.html';
const url=/^https?:/.test(entry)?entry:pathToFileURL(path.resolve(root,entry)).href;
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:932,height:430}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(`${url}${url.includes('?')?'&':'?'}test=1`,{waitUntil:'load'});
 const api=(method,...args)=>page.evaluate(({method,args})=>window.__SAKURAYO_TEST__[method](...args),{method,args});
 const snap=()=>api('snapshot');
 await api('start');
 assert.equal(await page.locator('#tutorialDrawer37').isVisible(),true);
 await page.locator('#tutorialSkip37').click();
 await api('dismissDialogue');await api('backMenu');
 await api('selectCharacter','sayo');await api('selectStage',2);
 async function start(mode='story') {await api('backMenu');await api('setRunMode46',mode);if(mode==='mainGod'){await api('unlockMainGod');await api('selectMainGodTier',1);}await api('start');await api('dismissDialogue');}
 await api('selectCharacter','aya');await start();await api('protectPlayer');
 await api('spawnEnemyNear','tank',30);await page.evaluate(()=>window.advanceTime(17));
 assert.ok((await snap()).counts.enemies>0,'old run must contain a live indexed enemy');
 await api('pauseNow');await page.locator('#retryP').click();await api('dismissDialogue');
 assert.equal((await snap()).counts.enemies,0);await page.locator('#skill').click();
 assert.deepEqual((await snap()).build.damageSources,{},'opening skill must not hit the old run');
 assert.equal((await snap()).counts.gems,0,'opening skill cannot generate old-run XP');
 await api('selectCharacter','sayo');
 for(const fusion of (await api('newFusionCatalog41'))){
  await start();await api('forceFusion41',fusion.id);assert.ok(Object.values((await snap()).build.fusionMechanics).some(Boolean));
  await api('pauseNow');await page.locator('#retryP').click();await api('dismissDialogue');
  assert.equal(Object.values((await snap()).build.fusionMechanics).some(Boolean),false,fusion.id);
 }
 for(const mode of ['story','mainGod','testimony']){
  await start(mode);
  await api('pauseNow');await page.locator('#retryP').click();await api('dismissDialogue');
  assert.equal((await snap()).ops,undefined,'DP deployment removed');assert.equal((await snap()).runMode,mode);
  await api('finish',true);const before=await api('saveSnapshot');await api('finish',true);const after=await api('saveSnapshot');
  assert.equal(after.runs,before.runs);assert.deepEqual(after.balance40.samples,before.balance40.samples);assert.deepEqual(after.mainGod.challenges,before.mainGod.challenges);
  await page.locator('#again').click();await api('dismissDialogue');
 }
 // The single-choice seam must compensate real XP bonuses; overflow itself is tested in state_unit.
 await start('mainGod');
 for(let level=2;level<=6;level++){
  await api('triggerUpgrade');assert.equal((await snap()).mode,'level');assert.equal((await snap()).player.level,level);
  await api('chooseUpgrade',0);assert.equal((await snap()).mode,'play');assert.equal((await snap()).player.level,level);
 }
 await start();await api('clearCombat');await api('spawnBossNow');await api('dismissDialogue');
 const player=(await snap()).player;await api('setBossHpRatio',0.000001);await api('setBossPosition',player.x+26,player.y-18);await api('spawnEnemyRelative','normal',1,0);await api('setPlayerHpRatio',0.01);
 await api('attackNow');await page.evaluate(()=>window.advanceTime(17));let won=await snap();
 assert.equal(won.mode,'dialogue','Boss death must stop before ordinary enemy contact');assert.ok(won.player.hp>0);
 await api('dismissDialogue');won=await snap();assert.equal(won.result.win,true);assert.equal(won.mode,'result');
 assert.deepEqual(errors,[]);
 console.log('PASS state smoke: tutorial, opening skill grid reset, six fusion resets, three mode retry/again, idempotent finish, Boss victory');
} finally {await browser.close();}

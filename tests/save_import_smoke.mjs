import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=process.env.SAKURAYO_ENTRY||path.join(root,'src/index.html');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:932,height:430},hasTouch:true});
 const errors=[],external=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 await page.goto(pathToFileURL(entry).href+'?test=1');
 await page.waitForFunction(()=>window.__SAKURAYO_TEST__);
 await page.locator('.bootArt35').waitFor({state:'detached'});
 const api=(name,...args)=>page.evaluate(({name,args})=>window.__SAKURAYO_TEST__[name](...args),{name,args});
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sakurayoV3')));
 async function importSave(value){
  await page.locator('#commandSettings47').click();await page.locator('#commandSave48').click();
  await page.locator('#saveText38').fill(JSON.stringify(value));await page.locator('#importSave38').click();
  assert.equal(await page.locator('#saveDrawer38').isVisible(),false,'actual import handler completed successfully');
 }
 async function rejectSave(value){
  const before=await api('saveSnapshot');
  await page.locator('#commandSettings47').click();await page.locator('#commandSave48').click();
  await page.locator('#saveText38').fill(JSON.stringify(value));await page.locator('#importSave38').click();
  assert.equal(await page.locator('#saveDrawer38').isVisible(),true,'invalid import stays open');
  assert.deepEqual(await api('saveSnapshot'),before,'rejected import never changes player progress');
  await page.locator('#saveDrawer38 .close').click();
 }
 await rejectSave({tal:[],mainGod:{},coins:987});
 await rejectSave({tal:{},mainGod:[],coins:987});
 // A single malformed entry formerly crashed persist → menuUpdate → commandModel47.
 const record={time:123,win:true,stage:4,character:'aya',level:19,kills:91,duration:88,fusion:'plagueforge'};
 const legacy={tal:{atk:2},mainGod:{points:42,unlockedTier:2},coins:1000021,unlock:4,done:['1','2','3','4'],character:'aya',settings:{master:.3,sfx:.2,music:.1},runHistory:[null,record,42]};
 await importSave(legacy);
 let s=await stored();assert.equal(s.coins,legacy.coins,"import preserves a legitimately earned large balance");assert.deepEqual(s.done,[1,2,3,4]);assert.deepEqual(s.runHistory,[record]);assert.equal(s.settings.damageText,'compact');assert.equal(s.settings.glow,'off');assert.equal(s.settings.master,.3);
 assert.equal(await page.locator('#characterList [data-character="aya"]').evaluate(el=>el.classList.contains('selected')),true,'import redraws selected character');
 await page.locator('#commandHistory47').click();assert.match(await page.locator('#commandBody47').textContent(),/神代绫/);await page.locator('#commandDrawer47 .close').click();
 await page.locator('#commandSupplies47').click();await page.locator('[data-supply="chapter4"]').click();await page.locator('#commandDrawer47 .close').click();
 await page.locator('#commandMail48').click();await page.locator('[data-mail="welcome"]').click();await page.locator('#commandMailClaim48').click();await page.locator('#commandDrawer47 .close').click();
 const receipts=await stored();
 await importSave(receipts);await page.reload();await page.waitForFunction(()=>window.__SAKURAYO_TEST__);await page.locator('.bootArt35').waitFor({state:'detached'});
 {const now=await stored();assert.equal(now.coins,receipts.coins+(receipts.talRefund46<0?Math.max(0,now.talRefund46):0),'import keeps coins; frozen-talent refund is paid once at boot');}assert.deepEqual((await stored()).shop40.ops.services,receipts.shop40.ops.services,'mail receipts survive import and startup');
 await page.locator('#commandSupplies47').click();assert.equal(await page.locator('[data-supply="chapter4"]').isDisabled(),true,'chapter reward cannot be claimed twice');await page.locator('#commandDrawer47 .close').click();
 const modern={...receipts,settings:{...receipts.settings,hudSize:'compact',contrast:0,uiCalm:0,fx:0,damageText:'full',glow:'soft',glowVersion:2}};
 await importSave(modern);assert.equal(await page.evaluate(()=>document.body.classList.contains('compactHud38')&&document.body.classList.contains('noContrast39')&&document.body.classList.contains('richUi39')),true,'import applies all UI setting classes');assert.equal((await api('crowdBudget')).quality,.62,'import applies reduced quality immediately');
 // Restore a chapter/tier selection, then import an older account: no locked launch survives.
 await api('selectStage',4);await importSave({...legacy,unlock:1,done:[],runHistory:[record]});
 assert.equal((await api('snapshot')).stage,1,'chapter selection clamped to imported unlock');assert.equal(await page.evaluate(()=>document.body.classList.contains('compactHud38')||document.body.classList.contains('noContrast39')||document.body.classList.contains('richUi39')),false,'legacy import restores default UI classes');
 await api('unlockMainGod');await api('selectMainGodTier',2);await importSave({...legacy,unlock:1,done:[],runHistory:[record]});
 const snapshot=await api('snapshot');assert.equal(snapshot.runMode,'story','locked main god selection cancelled');assert.equal(snapshot.mainGod.tier,1,'main god tier reset while locked');
 // Button changes the pending mission brief before any chapter is chosen.
 await page.locator('#menu .homeNav46 [data-open="stage"]').click();await page.locator('#modeTestimony46').click();assert.match(await page.locator('#commandActivityName48').textContent(),/证词模式/,'mode button updates the lobby mission brief immediately');await page.locator('#stageDrawer .close').click();
 await page.locator('#commandPrepare47').click();assert.match(await page.locator('#commandBody47').textContent(),/证词模式/);await page.locator('#commandDrawer47 .close').click();
 // Startup follows the same repair contract as import and continues to render the lobby.
 await page.evaluate(raw=>localStorage.setItem('sakurayoV3',JSON.stringify(raw)),legacy);await page.reload();await page.waitForFunction(()=>window.__SAKURAYO_TEST__);await page.locator('.bootArt35').waitFor({state:'detached'});
 assert.equal(await page.locator('#commandHistory47').isVisible(),true);s=await api('saveSnapshot');assert.equal(s.coins,legacy.coins+s.talRefund46,"startup preserves a legitimately earned large balance (plus one-time frozen-talent refund)");assert.deepEqual(s.done,[1,2,3,4]);assert.deepEqual(s.runHistory,[record]);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS save import/startup: legacy chapters/history/settings, receipts, selection clamps, mode brief; '+entry);
} finally {await browser.close();}

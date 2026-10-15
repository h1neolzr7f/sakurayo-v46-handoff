import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=path.resolve(root,process.env.SAKURAYO_ENTRY||process.argv[2]||'src/index.html');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:932,height:430},hasTouch:true}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 await page.goto(pathToFileURL(entry).href+'?test=1');await page.waitForFunction(()=>window.__SAKURAYO_TEST__);await page.locator('.bootArt35').waitFor({state:'detached'});
 const api=(name,...args)=>page.evaluate(({name,args})=>window.__SAKURAYO_TEST__[name](...args),{name,args});
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sakurayoV3')));
 const snapshot=()=>api('saveSnapshot');
 async function importSave(value){await page.locator('#commandSettings47').click();await page.locator('#commandSave48').click();await page.locator('#saveText38').fill(JSON.stringify(value));await page.locator('#importSave38').click();assert.equal(await page.locator('#saveDrawer38').isVisible(),false);}
 async function shop(tab){await page.locator('#menu .homeNav46 [data-open="shop"]').click();await page.locator(`[data-shop="${tab}"]`).click();}
 const base={tal:{},mainGod:{points:123456789},coins:123456789,unlock:1,tutorialDone:true,shop40:{ownedTalismans:['mech'],bannedSchools:['mech'],items:{bait:1,ammo:0},baitEquipped:true,equippedWeapon:'ammo'}};
 await importSave(base);assert.equal((await snapshot()).shop40.equippedWeapon,null);
 for(const pool of ['remnant','fashion','weapon']){
  await api('setPool46',pool);const before=(await snapshot()).coins;
  assert.equal((await api('pullGacha46',1)).ok,true);assert.equal((await snapshot()).coins,before-160);assert.equal((await stored()).coins,before-160);
  assert.equal((await api('pullGacha46',10)).ok,true);assert.equal((await snapshot()).coins,before-160-1440);
 }
 const before=(await snapshot()).coins;await api('grantCheat46');assert.equal((await snapshot()).coins,before+9999);
 await importSave({...base,coins:100});await shop('talismans');
 const talCard=name=>page.locator('[data-shop-group="talismans"] .shopItem40').filter({has:page.locator('h3',{hasText:name})});
 const gun=talCard('枪斗术');
 await gun.locator('button').click();let s=await stored();assert.equal(s.coins,20);assert.deepEqual(s.shop40.ownedTalismans,['mech','gun']);assert.deepEqual(s.shop40.bannedSchools,['mech']);
 assert.equal(await gun.locator('button').textContent(),'装备');await gun.locator('button').click();s=await stored();assert.equal(s.coins,20);assert.deepEqual(s.shop40.bannedSchools,['mech']);
 await talCard('机械师').locator('button').click();await gun.locator('button').click();s=await stored();assert.deepEqual(s.shop40.bannedSchools,['gun']);assert.equal(s.coins,20);await page.locator('#shopDrawer .close').click();
 await importSave({...base,coins:400});await shop('items');const bait=page.locator('[data-shop-group="items"] .shopItem40').filter({has:page.locator('h3',{hasText:'丧尸诱饵'})});
 await bait.locator('.shopUpgrade40').click();s=await stored();assert.equal(s.shop40.items.bait,2);assert.equal(s.coins,240);
 await bait.locator('.shopUpgrade40').click();s=await stored();assert.equal(s.shop40.items.bait,3);assert.equal(s.coins,10);assert.equal(await bait.locator('.shopUpgrade40').count(),0);await page.locator('#shopDrawer .close').click();
 const excessive={...base,unlock:4,done:[1,2,3,4],tal:{atk:Number.MAX_SAFE_INTEGER,hp:999,luck:999,mag:999,flow:999},mainGod:{points:123456789,power:Number.MAX_SAFE_INTEGER,regenBlood:3,cursedHeart:1},shop40:{starter:{assault:999},items:{bait:999,ammo:0},equippedWeapon:'ammo'}};
 await importSave(excessive);s=await snapshot();assert.equal(s.tal.atk,10);assert.equal(s.mainGod.power,5);assert.equal(s.shop40.items.bait,3);assert.equal(s.shop40.equippedWeapon,null);
 await page.reload();await page.waitForFunction(()=>window.__SAKURAYO_TEST__);await page.locator('.bootArt35').waitFor({state:'detached'});assert.equal((await snapshot()).mainGod.power,5);
 await page.locator('#menu .homeNav46 [data-open="stage"]').click();await page.locator('.exchange36').click();assert.match(await page.locator('#mgReset37').textContent(),/133/);page.once('dialog',d=>d.accept());await page.locator('#mgReset37').click();s=await stored();assert.equal(s.mainGod.points,123456922);assert.equal(s.mainGod.power,0);assert.equal(s.mainGod.regenBlood,0);assert.equal(s.mainGod.cursedHeart,0);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS economy browser: real import/pool/purchase/equip/bait/refund controls; '+entry);
}finally{await browser.close();}

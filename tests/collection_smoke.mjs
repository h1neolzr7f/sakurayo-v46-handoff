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
 async function importSave(value){
  await api('backMenu');await page.locator('#commandSettings47').click();await page.locator('#commandSave48').click();
  await page.locator('#saveText38').fill(JSON.stringify(value));await page.locator('#importSave38').click();
  assert.equal(await page.locator('#saveDrawer38').isVisible(),false);
 }
 const base={character:'sayo',skin:'default',coins:20000,unlock:4,done:[1,2,3,4],tutorialDone:true,tal:{atk:2,hp:3,luck:1,flow:2},
  mainGod:{power:2,vitality:1,psiLink:1,tempo:1,cursedHeart:1},
  shop40:{starter:{assault:2},equippedStarter:'assault',items:{mirror:1},equippedWeapon:'mirror',ops:{supplies:{chapter4:true},services:{welcomeClaimed:true,mailRead:{welcome:true},loginDates:['2026-10-05']}}}};
 const full=await page.evaluate(value=>{
  const L=window.SakurayoLobby;value.shop40=L.normalizeOps(value.shop40);const ops=value.shop40.ops;
  for(const card of [...L.CARDS,...L.SCHOOL_CARDS,...L.JOB_CARDS,...L.FUSION_CARDS])ops.owned[card.id]=9;
  for(const [pool,cards] of [['fashion',L.FASHION_CARDS],['weapon',L.WEAPON_CARDS]]){
   for(const card of cards)ops[pool].owned[card.id]=9;
   Object.assign(ops[pool],{pity:71,pitySR:8,shards:227,pulls:234});
  }
  Object.assign(ops,{pity:79,pitySR:9,shards:212,pulls:234,last:['sayo_echo']});return value;
 },structuredClone(base));
 function combat(snapshot){
  const p=snapshot.player,keys=['attackDamage','hp','maxHp','criticalChance','moveSpeed','baseSkillCooldown','shield','maxShield','damageReduction','bladePower','attackInterval','pierce'];
  for(const key of keys)assert.equal(typeof p[key],'number',`snapshot exposes ${key}`);
  return Object.fromEntries(keys.map(key=>[key,p[key]]));
 }
 async function start(mode,character){
  await api('selectCharacter',character);await api('selectStage',2);await api('setRunMode46',mode);
  if(mode==='mainGod')await api('selectMainGodTier',1);
  await api('start');await api('dismissDialogue');const snapshot=await api('snapshot');assert.equal(snapshot.mode,'play');return combat(snapshot);
 }
 for(const mode of ['story','testimony','mainGod'])for(const character of ['sayo','aya','rion']){
  await importSave(base);const baseline=await start(mode,character);
  await importSave(full);assert.deepEqual(await start(mode,character),baseline,`${character}/${mode} full ownership`);
  await api('backMenu');await api('selectCharacter',character);
  const fashion={sayo:'fashion_sayo_crown',aya:'fashion_aya_funeral',rion:'fashion_rion_bride'}[character];
  const weapon={sayo:'weapon_sayo_final',aya:'weapon_aya_mirror',rion:'weapon_rion_burial'}[character];
  assert.equal((await api('equip46','fashion',fashion)).ok,true);assert.equal((await api('equip46','weapon',weapon)).ok,true);
  const before=(await api('saveSnapshot')).shop40.ops;
  assert.deepEqual(await start(mode,character),baseline,`${character}/${mode} equipped collection`);
  assert.deepEqual((await api('saveSnapshot')).shop40.ops,before,'starting keeps collection, pity, equipped selections and receipts');
  await api('backMenu');await page.reload();await page.waitForFunction(()=>window.__SAKURAYO_TEST__);await page.locator('.bootArt35').waitFor({state:'detached'});
  assert.deepEqual((await api('saveSnapshot')).shop40.ops,before,'collection survives serialized reload');
 }
 await importSave(full);
 await page.locator('#menu .homeNav46 [data-open="gacha"]').click();
 for(const pool of ['remnant','fashion','weapon']){
  await api('setPool46',pool);assert.match(await page.locator('#gachaBody46').innerText(),/收藏不增加战斗属性/);
  assert.doesNotMatch(await page.locator('#gachaBody46').innerText(),/吃满|拥有即加成/);
 }
 await page.locator('#gachaDrawer .close').click();await page.locator('#menu .homeNav46 [data-open="roster"]').click();
 await api('setRosterTab46','school');await page.locator('#rosterWall46 [data-card="school_shrine"]').click();
 assert.match(await page.locator('#rosterPeek46').innerText(),/收藏不增加战斗属性/);
 assert.match(await page.locator('#rosterPeek46').innerText(),/巫女倾向 ×1.3/);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS collection browser: three characters/modes, actual starts, equipment, serialized receipts and visible rules; '+entry);
}finally{await browser.close();}

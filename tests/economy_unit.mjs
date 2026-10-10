import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const html=fs.readFileSync(new URL('../src/index.html',import.meta.url),'utf8');
function source(name){
 const start=html.indexOf('  function '+name+'(');assert.ok(start>=0,`production function ${name} exists`);
 const lineEnd=html.indexOf('\n',start);
 const end=html.slice(start,lineEnd).endsWith('}')?lineEnd:html.indexOf('\n  }',lineEnd)+4;
 return html.slice(start,end);
}
function runtime(){
 const ctx={window:{}};vm.createContext(ctx);
 for(const name of ['catalog','save','lobby','economy']){
  const url=new URL('../src/runtime/sakurayo-'+name+'.js',import.meta.url);
  if(fs.existsSync(url))vm.runInContext(fs.readFileSync(url,'utf8'),ctx);
 }
 return ctx;
}
const json=v=>JSON.parse(JSON.stringify(v));
test('readable legacy storage remains readable even when writes throw',()=>{
 let writes=0;const raw='{"coins":12345,"unlock":4}';
 const ctx={localStorage:{getItem:()=>raw,setItem(){writes++;throw Object.assign(new Error('full'),{name:'QuotaExceededError'});}},normalizeGameSave:v=>v,DEF:{}};
 vm.createContext(ctx);vm.runInContext(source('bootLoadSave')+'\nglobalThis.read=bootLoadSave();',ctx);
 assert.equal(ctx.read.coins,12345);assert.equal(ctx.read.unlock,4);assert.equal(writes,0,'startup never probes by writing');
});
test('every pool preserves high balances, including cheat and snapshot',()=>{
 const ctx=runtime(),L=ctx.window.SakurayoLobby;
 for(const pool of L.POOL_IDS){const s={coins:123456789,shop40:{}};assert.equal(L.pull(s,1,()=>.1,pool).ok,true);assert.equal(s.coins,123456629);assert.equal(L.pull(s,10,()=>.1,pool).ok,true);assert.equal(s.coins,123455189);assert.equal(L.snapshot(s).coins,s.coins);}
 const s={coins:123456789,shop40:{}};assert.equal(L.grantCheat(s).coins,123466788);
});
test('owned relationships and every actual merchandise cap normalize on startup/import',()=>{
 const ctx=runtime(),S=ctx.window.SakurayoSave;
 for(const strict of [false,true]){
 const s=S.normalize({tal:{atk:1e9,hp:1e9,luck:1e9,mag:1e9,flow:1e9},mainGod:{points:123456789,power:1e9,fortune:1e9,regenBlood:1e9,cursedHeart:1e9},shop40:{starter:{assault:1e9},items:{ammo:0,bait:1e9},equippedWeapon:'ammo',baitEquipped:true}},{strict});
 assert.deepEqual(json(s.tal),{atk:10,hp:10,luck:8,mag:8,flow:8});assert.equal(s.mainGod.power,5);assert.equal(s.mainGod.fortune,4);assert.equal(s.mainGod.regenBlood,3);assert.equal(s.mainGod.cursedHeart,1);assert.equal(s.mainGod.points,123456789);assert.equal(s.shop40.starter.assault,5);assert.equal(s.shop40.items.bait,3);assert.equal(s.shop40.equippedWeapon,null);
 }
 assert.equal(S.normalize({shop40:{items:{ammo:1},equippedWeapon:'ammo'}}).shop40.equippedWeapon,'ammo');
});
function shopContext(){
 const buttons=[],cards=[],ctx=runtime();Object.assign(ctx,{save:{coins:100,unlock:1,character:'sayo',shop40:{ownedTalismans:['mech'],bannedSchools:['mech'],items:{bait:1},baitEquipped:true}},SCHOOL:{gun:{n:'枪斗术'},mech:{n:'机巧'}},TALISMAN_SCHOOLS40:['mech','gun'],ITEMS40:{bait:{n:'诱饵',max:3,base:90,step:70}},persistCount:0,renderCount:0,toasts:[],toast(s){ctx.toasts.push(s);},persist(){ctx.persistCount++;return true;},renderShop35(){ctx.renderCount++;},document:{createElement(){return {textContent:'',classList:{add(){}},appendChild(n){buttons.push(n);}};}},shopCard40(icon,title,desc,text,disabled,onclick){const card={title,text,disabled,onclick,classList:{add(){}},appendChild(n){buttons.push(n);}};cards.push(card);return card;}});
 for(const name of ['talismanSlots40','itemCost40','buyItem40','buyTalisman40','equipTalisman40','renderItemShop40','renderTalismanShop40'])if(html.includes('  function '+name+'('))vm.runInContext(source(name),ctx);
 return {ctx,buttons,cards,section:{appendChild(){}}};
}
test('buying talisman with full slots persists once; repeated old button never pays twice',()=>{
 const {ctx,cards,section}=shopContext();ctx.renderTalismanShop40(section);const button=cards.find(c=>c.title.startsWith('枪斗术'));button.onclick();button.onclick();
 assert.equal(ctx.save.coins,20);assert.deepEqual(json(ctx.save.shop40.ownedTalismans),['mech','gun']);assert.deepEqual(json(ctx.save.shop40.bannedSchools),['mech']);assert.equal(ctx.persistCount,1);assert.equal(ctx.renderCount,1);
 cards.length=0;ctx.renderTalismanShop40(section);cards.find(c=>c.title.startsWith('枪斗术')).onclick();assert.deepEqual(json(ctx.save.shop40.bannedSchools),['mech']);assert.equal(ctx.persistCount,1,'full equip has no mutation');
 cards.find(c=>c.title.startsWith('机巧')).onclick();cards.find(c=>c.title.startsWith('枪斗术')).onclick();assert.deepEqual(json(ctx.save.shop40.bannedSchools),['gun']);assert.equal(ctx.save.coins,20);
});
test('bait Lv.1 offers actual upgrade to 2 and 3 and disables unaffordable/max upgrade',()=>{
 const {ctx,buttons,cards,section}=shopContext();ctx.save.coins=400;ctx.renderItemShop40(section);assert.equal(buttons.length,1);assert.equal(buttons[0].disabled,false);buttons[0].onclick();assert.equal(ctx.save.shop40.items.bait,2);assert.equal(ctx.save.coins,240);
 buttons.length=0;ctx.renderItemShop40(section);buttons[0].onclick();assert.equal(ctx.save.shop40.items.bait,3);assert.equal(ctx.save.coins,10);buttons.length=0;ctx.renderItemShop40(section);assert.equal(buttons.length,0);
});
test('refund sums exact arithmetic series and is bounded for corrupted input',()=>{
 const ctx=runtime();ctx.save={mainGod:{power:5,regenBlood:3,cursedHeart:1}};
 const start=html.indexOf('  const MAIN_GOD_UPGRADES36='),end=html.indexOf('  function mainGodUpgradeCost36',start);vm.runInContext(html.slice(start,end),ctx);
 // Baseline adds this catalog item later; repaired catalog already includes it.
 vm.runInContext('if(!MAIN_GOD_ITEMS36.cursedHeart)MAIN_GOD_ITEMS36.cursedHeart={max:1,base:24,step:0};',ctx);
 vm.runInContext(source('totalMainGodInvestment37'),ctx);assert.equal(ctx.totalMainGodInvestment37(),133);
 ctx.save.mainGod={power:Number.MAX_SAFE_INTEGER};assert.equal(vm.runInContext('totalMainGodInvestment37()',ctx,{timeout:150}),55);
});
test('wallet does not recommend paid-for goods',()=>{
 const E=runtime().window.SakurayoEconomy;const info=E.advice('sayo',1000,{equippedStarter:'assault',starter:{assault:5},items:{ammo:1}},{assault:{n:'core'}},{ammo:{n:'ammo',max:1,base:140,step:0}},[{id:'owned',n:'owned',price:40}]);assert.equal('next' in info,false);
});
test('writeSave returns real write outcome and failure stays visible until successful retry',()=>{
 const nodes=new Map(),ctx={window:{},save:{coins:123},fail:true,document:{getElementById:id=>nodes.get(id),body:{appendChild(n){nodes.set(n.id,n);}},createElement(){return {style:{},setAttribute(){},remove(){nodes.delete(this.id);}};}},localStorage:{setItem(){if(ctx.fail)throw Object.assign(new Error('full'),{name:'QuotaExceededError'});}}};vm.createContext(ctx);vm.runInContext(source('storageStatus')+'\n'+source('writeSave'),ctx);
 assert.equal(ctx.writeSave(),false);assert.match(nodes.get('storageStatus38').textContent,/未能写入/);assert.equal(ctx.writeSave(),false);assert.equal(nodes.size,1);ctx.fail=false;assert.equal(ctx.writeSave(),true);assert.equal(nodes.size,0);
});
test('import saves candidate before replacing runtime object; failure has no success effects',()=>{
 const drawer={classList:{add(name){assert.equal(name,'hidden');ctx.hidden=true;}}};
 const ctx={window:{SakurayoUI:{close(node){assert.equal(node,drawer);node.classList.add('hidden');}}},save:{coins:123},SKINS35:[],writeOK:false,reconciles:0,menus:0,toasts:[],hidden:false,validateSave39:v=>v,normalizeGameSave:v=>v,writeSave(candidate){ctx.written=json(candidate);return ctx.writeOK;},reconcileImportedSave39(){ctx.reconciles++;},menuUpdate(){ctx.menus++;},toast(s){ctx.toasts.push(s);},$(selector){return selector==='#saveText38'?{value:'{"tal":{},"mainGod":{},"coins":456}'}:drawer;}};
 vm.createContext(ctx);vm.runInContext(source('importSave39'),ctx);const identity=ctx.save;ctx.importSave39();assert.deepEqual(ctx.save,{coins:123});assert.equal(ctx.hidden,false);assert.equal(ctx.reconciles,0);assert.equal(ctx.toasts.length,0);assert.equal(ctx.written.coins,456);
 ctx.writeOK=true;ctx.importSave39();assert.equal(ctx.save,identity);assert.equal(ctx.save.coins,456);assert.equal(ctx.hidden,true);assert.equal(ctx.reconciles,1);assert.equal(ctx.menus,1);assert.match(ctx.toasts[0],/已导入/);
});
test('all catalog limits apply uniformly; legitimate balances remain lifetime counters',()=>{
 const ctx=runtime(),C=ctx.window.SakurayoCatalog,S=ctx.window.SakurayoSave;
 const expected={tal:{atk:10,hp:10,luck:8,mag:8,flow:8},mainGodUpgrades:{power:5,vitality:5,tempo:5,resonance:5,fortune:4},mainGodItems:{regenBlood:3,psiLink:3,gunBlade:3,mageCircuit:3,summonPage:3,spaceRing:1,rebirthDoll:1,sideKey:3,cursedHeart:1},starters:{assault:5,bastion:5,flow:5,arcane:5},items:{bait:3,ammo:1,whetstone:1,mirror:1}};
 const high=group=>Object.fromEntries(Object.keys(group).map(id=>[id,Number.MAX_SAFE_INTEGER]));
 const value={coins:123456789,tal:high(expected.tal),mainGod:{...high(expected.mainGodUpgrades),...high(expected.mainGodItems),points:123456789},shop40:{starter:high(expected.starters),items:high(expected.items)}};
 const clean=S.normalize(value,{strict:true});assert.deepEqual(json(clean.tal),expected.tal);assert.deepEqual(json(clean.shop40.starter),expected.starters);assert.deepEqual(json(clean.shop40.items),expected.items);assert.equal(clean.mainGod.points,123456789);assert.equal(clean.coins,123456789);
 for(const group of ['mainGodUpgrades','mainGodItems'])for(const [id,max] of Object.entries(expected[group]))assert.equal(clean.mainGod[id],max);
 for(const [group,defs] of Object.entries(expected)){assert.ok(Object.isFrozen(C[group]));for(const [id,max] of Object.entries(defs)){assert.equal(C[group][id].max,max);assert.ok(Object.isFrozen(C[group][id]));}}
});

import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../src/index.html',import.meta.url),'utf8');
const runtime=name=>fs.readFileSync(new URL(`../src/runtime/sakurayo-${name}.js`,import.meta.url),'utf8');
function fn(name){
 const start=html.indexOf(`  function ${name}(`),first=html.indexOf('\n',start),line=html.slice(start,first);
 assert.ok(start>=0,`production function ${name} exists`);
 return line.trimEnd().endsWith('}')?line:html.slice(start,html.indexOf('\n  }',first)+4);
}
function world(character='sayo',mode='story'){
 const noop=()=>{},c={Math,Date,Set,Object,Number,Array,console,P:{},W:932,H:430,window:{},runMode36:mode,selected:2,selectedMainGodTier36:1,levelRerolls:2,pets:[],
  save:{character,skin:'default',tal:{flow:0,hp:0,atk:0,mag:0,luck:0},mainGod:{power:0,gunBlade:0,vitality:0,regenBlood:0,psiLink:0,mageCircuit:0,tempo:0,spaceRing:0,resonance:0,rebirthDoll:0,summonPage:0,fortune:0},shop40:{}},
  setForm:noop,refreshPlan:noop,storyMemory38:()=>({}),char35:()=>({id:character}),charAnimPath35:()=>'',artImage:noop,updateCharacterUI35:noop,
  isMainGodRun36:()=>mode==='mainGod',mainGodTier36:()=>({xp:1}),randomOffers37:xs=>xs.slice(0,1),MAIN_GOD_CHALLENGES37:[{id:'test',ok:()=>true}],syncPets:noop,
  clamp:(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),fxStamp:noop,updateCareerFormation:noop,$:()=>({classList:{add:noop,remove:noop}})};
 c.globalThis=c;vm.createContext(c);
 vm.runInContext(runtime('catalog')+'\n'+runtime('lobby'),c);
 c.save.shop40=c.window.SakurayoLobby.normalizeOps({starter:{},items:{}});
 const start=html.indexOf('  const STARTERS40={');
 vm.runInContext(html.slice(start,html.indexOf('  const ITEMS40=',start))+'\n'+['resetP','applyCharacterRun35','applyMainGodRun36','applyMainGodChallenge37','applyStoryRun38','applyCombatRun39','applyShopRun40','applyFusionRun41','starterChapterMul40'].map(fn).join('\n'),c);
 return c;
}
const stats=c=>Object.fromEntries(['dmg','hp','maxHp','crit','spd','skillCd','sh','maxSh','damageReduce','bladePower','skillPow','spellPow','rate','pierce'].map(k=>[k,c.P[k]]));
function collect(c){
 const L=c.window.SakurayoLobby,ops=c.save.shop40.ops;
 for(const card of [...L.CARDS,...L.SCHOOL_CARDS,...L.JOB_CARDS,...L.FUSION_CARDS])ops.owned[card.id]=9;
 for(const pool of ['fashion','weapon'])for(const card of (pool==='fashion'?L.FASHION_CARDS:L.WEAPON_CARDS))ops[pool].owned[card.id]=9;
 Object.assign(ops,{pity:79,pitySR:9,pulls:234,shards:212,last:['sayo_echo'],supplies:{chapter4:true},services:{welcomeClaimed:true,mailRead:{welcome:true},loginDates:['2026-10-05']}});
 Object.assign(ops.fashion,{pity:35,pitySR:7,shards:23});Object.assign(ops.weapon,{pity:63,pitySR:8,shards:87});
}
// Catches any collection-derived combat multiplier, including the default two scraps.
test('fresh defaults have only normal Sayo starting stats',()=>{
 const c=world();c.resetP();assert.deepEqual(stats(c),{dmg:19.44,hp:100,maxHp:100,crit:.08,spd:211.2,skillCd:7,sh:0,maxSh:0,damageReduce:0,bladePower:1,skillPow:1,spellPow:1,rate:.45,pierce:0});
});
for(const mode of ['story','testimony','mainGod'])for(const character of ['sayo','aya','rion'])test(`${character}/${mode} full collection cannot change real reset stats or erase collection`,()=>{
 const c=world(character,mode),L=c.window.SakurayoLobby;
 Object.assign(c.save.tal,{atk:2,hp:3,luck:1,flow:2});
 Object.assign(c.save.mainGod,{power:2,vitality:1,psiLink:1,tempo:1,cursedHeart:1});
 c.save.shop40.starter.assault=2;c.save.shop40.equippedStarter='assault';c.save.shop40.items.mirror=1;c.save.shop40.equippedWeapon='mirror';
 c.resetP();const baseline=stats(c);collect(c);
 const fashion={sayo:'fashion_sayo_crown',aya:'fashion_aya_funeral',rion:'fashion_rion_bride'}[character];
 const weapon={sayo:'weapon_sayo_final',aya:'weapon_aya_mirror',rion:'weapon_rion_burial'}[character];
 for(const equipped of [false,true]){
  if(equipped){assert.equal(L.equip(c.save,'fashion',fashion).ok,true);assert.equal(L.equip(c.save,'weapon',weapon).ok,true);}
  const before=JSON.stringify(c.save);c.resetP();assert.deepEqual(stats(c),baseline,`equipment=${equipped}`);assert.equal(JSON.stringify(c.save),before,'run reset preserves ownership, pity, equipment and other save fields');
 }
});
// Catches over-broad removal of existing progression and shop tradeoffs.
test('talents, initial core and regular shop mirror still change a real start',()=>{
 const c=world();Object.assign(c.save.tal,{atk:2,hp:3,luck:1,flow:2});c.save.shop40.equippedStarter='assault';c.save.shop40.starter.assault=2;c.save.shop40.equippedWeapon='mirror';c.resetP();
 assert.ok(Math.abs(c.P.dmg-27.44)<.001);assert.equal(c.P.maxHp,124);assert.equal(c.P.sh,36);assert.equal(c.P.damageReduce,.05);assert.ok(c.P.crit>.12);assert.ok(Math.abs(c.P.skillCd-6.72)<1e-9);
});
// Catches accidental removal/double stacking of declared school appearance weights.
test('real lobby install retains declared school weights without duplicate stacking',()=>{
 const c=world(),noop=()=>{};
 Object.assign(c,{artUrl:p=>p,wireLivePuppet46:noop,renderStages:noop,menuUpdate:noop,$:()=>null,upgradeWeight:()=>10});
 vm.runInContext(fn('installLobby46'),c);c.installLobby46();
 assert.equal(c.upgradeWeight({s:'mech'}),10);
 c.save.shop40.ops.owned.school_mech=1;assert.equal(c.upgradeWeight({s:'mech'}),13);
 c.save.shop40.ops.owned.job_swarm=1;assert.equal(c.upgradeWeight({s:'mech'}),19.5);
 c.save.shop40.ops.owned.fusion_magitech=1;assert.ok(Math.abs(c.upgradeWeight({s:'mech'})-31.2)<1e-9);
 c.save.shop40.ops.owned.job_swarm=999;c.save.shop40.ops.owned.fusion_magitech=999;
 assert.ok(Math.abs(c.upgradeWeight({s:'mech'})-31.2)<1e-9);assert.equal(c.upgradeWeight({s:'gun'}),10);
 c.save.shop40.ops.fashion.owned.fashion_sayo_night=1;c.window.SakurayoLobby.equip(c.save,'fashion','fashion_sayo_night');
 assert.equal(c.upgradeWeight({s:'shrine'}),13);
 c.save.shop40.ops.owned.school_shrine=1;assert.equal(c.upgradeWeight({s:'shrine'}),13,'equipped fashion and same school card share the existing school multiplier');
});

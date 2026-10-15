import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const runtime=new URL('../src/runtime/sakurayo-save.js',import.meta.url);
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../src/runtime/sakurayo-catalog.js',import.meta.url),'utf8'),ctx);
vm.runInContext(fs.readFileSync(runtime,'utf8'),ctx);
const S=ctx.window.SakurayoSave;
const json=v=>JSON.parse(JSON.stringify(v));
const legacy={tal:{atk:2},mainGod:{points:42},coins:123,unlock:4,settings:{master:.3,sfx:.2,music:.1}};
test('legacy numeric chapter IDs unlock progress and retain distinct completions',()=>assert.deepEqual(json(S.normalize({...legacy,done:['1','2','3','4','4',null]}).done),[1,2,3,4]));
test('discard invalid run entries before the 30-record cap; preserve actual run evidence',()=>{
 const record={time:123,win:true,stage:4,character:'aya',fusion:'plagueforge',careers:'枪斗术',damageSources:{shot:99}};
 assert.deepEqual(json(S.normalize({...legacy,runHistory:[null,record,42,[],false]}).runHistory),[record]);
 assert.equal(S.normalize({...legacy,runHistory:[...Array(30).fill(null),...Array(35).fill(record)]}).runHistory.length,30);
});
test('old volume settings gain current defaults without overriding player volume',()=>assert.deepEqual(json(S.normalize(legacy).settings),{master:.3,sfx:.2,music:.1,vibration:1,fx:1,hudSize:'standard',damageText:'compact',contrast:1,uiCalm:1,glow:'off',glowVersion:2,mascot:'follow'}));
test('normalize is pure, idempotent and preserves valid progress and receipts',()=>{
 const value={...legacy,done:[1,4],ownedSkins:['default','haori'],skin:'haori',character:'rion',claim:{chapter4:true},shop40:{starter:{assault:3},ops:{pity:19,owned:{fusion_magitech:2},services:{welcomeClaimed:true,mailRead:{welcome:true},loginDates:['2026-10-05']}}},extensions:{'example.pack':{version:2,data:{claimed:true}}}};
 const before=JSON.stringify(value),a=S.normalize(value);assert.equal(JSON.stringify(value),before);assert.deepEqual(json(S.normalize(a)),json(a));assert.equal(a.skin,'haori');assert.equal(a.tal.atk,2);assert.equal(a.mainGod.points,42);assert.deepEqual(json(a.shop40.ops.services),value.shop40.ops.services);assert.deepEqual(json(a.extensions),value.extensions);
});
test('invalid root and core arrays cannot be imported',()=>{
 assert.throws(()=>S.normalize([], {strict:true}));assert.throws(()=>S.normalize({tal:[],mainGod:{}},{strict:true}));assert.throws(()=>S.normalize({tal:{},mainGod:[]},{strict:true}));
});
test('malformed containers and settings are repaired at the boundary',()=>{
 const a=S.normalize({...legacy,settings:{master:2,sfx:'oops',music:-1,hudSize:'huge',damageText:'bad',glow:'vivid',glowVersion:2,fx:0,contrast:0,uiCalm:false},storyChoices38:[],balance40:[],shop40:[]});
 assert.equal(a.settings.master,1);assert.equal(a.settings.sfx,.8);assert.equal(a.settings.music,0);assert.equal(a.settings.damageText,'compact');assert.equal(a.settings.glow,'vivid');assert.equal(a.settings.fx,0);assert.equal(a.settings.uiCalm,0);assert.equal(Array.isArray(a.storyChoices38),false);assert.equal(Array.isArray(a.balance40),false);
});
test('nested prototype keys and unknown top-level fields are excluded',()=>{
 const raw=JSON.parse('{"tal":{"atk":3,"__proto__":{"polluted":true}},"mainGod":{},"constructor":{},"unknown":1,"extensions":{"__proto__":{},"valid.pack":{"data":{"prototype":{},"safe":true}}}}');
 const a=S.normalize(raw);assert.equal(Object.hasOwn(a,'unknown'),false);assert.equal(Object.hasOwn(a.tal,'__proto__'),false);assert.equal(Object.hasOwn(a.extensions,'__proto__'),false);assert.equal(Object.hasOwn(a.extensions['valid.pack'].data,'prototype'),false);
});
test('defaults are fresh, missing startup fields migrate, and glow migration respects current choices',()=>{
 const first=S.defaults(),second=S.defaults();first.settings.master=0;first.shop40.starter.assault=5;
 assert.equal(second.settings.master,.8);assert.equal(second.shop40.starter.assault,0);
 assert.equal(S.normalize({}).mainGod.unlockedTier,1);
 assert.equal(S.normalize({...legacy,settings:{glow:'vivid',glowVersion:1}}).settings.glow,'off');
 assert.equal(S.normalize({...legacy,settings:{mascot:'rion'}}).settings.mascot,'rion');
 assert.equal(S.normalize({...legacy,settings:{mascot:'boss'}}).settings.mascot,'follow');
 assert.equal(S.normalize({...legacy,settings:{glow:'soft',glowVersion:2}}).settings.glow,'soft');
});
test('collection migration retains receipts and balances and shares no references with input',()=>{
 for(const name of ['services','command','lobby'])vm.runInContext(fs.readFileSync(new URL('../src/runtime/sakurayo-'+name+'.js',import.meta.url),'utf8'),ctx);
 const L=ctx.window.SakurayoLobby,C=ctx.window.SakurayoCommand,M=ctx.window.SakurayoServices;
 const raw={...legacy,done:[4],ownedSkins:['default','haori','extra_costume'],skin:'extra_costume',shop40:{ops:{pity:21,shards:47,owned:{fusion_magitech:2},supplies:{chapter4:true},services:{welcomeClaimed:true,mailRead:{welcome:true},loginDates:['2026-10-05']},fashion:{owned:{fashion_sayo_crown:1},equipped:'fashion_sayo_crown'},weapon:{owned:{weapon_sayo_final:1},equipped:'weapon_sayo_final'}}}};
 const before=JSON.stringify(raw),options={normalizeOps:L.normalizeOps,skins:['default','haori','extra_costume']};
 const a=S.normalize(raw,options);assert.equal(JSON.stringify(raw),before);
 assert.equal(a.shop40.ops.pity,21);assert.equal(a.shop40.ops.shards,47);assert.equal(a.shop40.ops.owned.fusion_magitech,2);assert.equal(a.skin,'extra_costume');
 assert.equal(C.claimSupply(a,'chapter4').reason,'claimed');assert.equal(M.claimMail(a,'welcome',C).reason,'claimed');assert.equal(a.coins,123);
 assert.deepEqual(json(S.normalize(a,options)),json(a));
 a.shop40.ops.services.mailRead.welcome=false;assert.equal(raw.shop40.ops.services.mailRead.welcome,true);
});
test('earned lifetime balances survive startup and export/import above legacy import caps',()=>{
 const value={...legacy,coins:1000021,runs:1000022,kills:100000123,bosses:100000124,mainGod:{points:1000023,clears:1000024,runs:1000025,unlockedTier:4}};
 for(const options of [{},{strict:true}]){
  const clean=S.normalize(value,options);
  assert.equal(clean.coins,value.coins);assert.equal(clean.runs,value.runs);assert.equal(clean.kills,value.kills);assert.equal(clean.bosses,value.bosses);
  for(const key of ['points','clears','runs'])assert.equal(clean.mainGod[key],value.mainGod[key]);
 }
 assert.equal(S.normalize({...legacy,coins:Infinity}).coins,0);
 assert.equal(S.normalize({...legacy,coins:-12}).coins,0);
});

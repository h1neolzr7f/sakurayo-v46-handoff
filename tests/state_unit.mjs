import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../src/index.html',import.meta.url),'utf8');
function fn(name){
  const start=html.indexOf(`  function ${name}(`);
  if(start<0)return '';
  const first=html.indexOf('\n',start), line=html.slice(start,first);
  if(line.trimEnd().endsWith('}'))return line;
  return html.slice(start,html.indexOf('\n  }',first)+4);
}
function world(names){
  const nodes=new Map();
  const noop=()=>{};
  const c={console,Math,Set,Object,Number,Array,Date,performance:{now:()=>0},P:{},W:932,H:430,
    window:{},save:{tal:{flow:0,hp:0,atk:0,mag:0,luck:0},ach:{},character:'sayo',skin:'default',storyChoices38:{},shop40:{starter:{},items:{}},mainGod:new Proxy({challenges:{}},{get:(o,k)=>o[k]??0})},
    state:'play',runMode36:'story',pendingMode46:'story',activeTrial46:null,selected:2,selectedMainGodTier36:1,levelRerolls:2,pets:[],
    $:s=>{if(!nodes.has(s))nodes.set(s,{classList:{add:noop,remove:noop},textContent:'',innerHTML:''});return nodes.get(s);},
    setForm:noop,refreshPlan:noop,storyMemory38:()=>({}),char35:()=>({id:'sayo'}),charAnimPath35:()=>'',artImage:noop,updateCharacterUI35:noop,
    isMainGodRun36:()=>c.runMode36==='mainGod',mainGodTier36:()=>({xp:1}),randomOffers37:xs=>xs.slice(0,1),MAIN_GOD_CHALLENGES37:[{id:'test',ok:()=>true}],syncPets:noop,
    starterChapterMul40:()=>1,STARTERS40:{},fxStamp:noop,updateCareerFormation:noop,hideTransient:noop,renderChoices:()=>c.choices++,choices:0,sound:noop,toast:noop,dailyMod46:()=>false,abyssMul46:()=>1,look46:{},
  };
  vm.createContext(c);vm.runInContext(names.map(fn).join('\n'),c);return c;
}
const resetFns=['resetP','applyCharacterRun35','applyMainGodRun36','applyMainGodChallenge37','applyStoryRun38','applyCombatRun39','applyShopRun40','applyFusionRun41'];
test('reset deletes all old run properties and preserves player identity',()=>{
 const c=world(resetFns), p=c.P;Object.assign(p,{nanoNinja41:1,bloodMage41:1,lordRisk:1.3,revive:2,careerExtra:9});c.resetP();
 assert.equal(c.P,p);assert.equal(c.P.nanoNinja41,undefined);assert.equal(c.P.bloodMage41,undefined);assert.equal(c.P.careerExtra,undefined);assert.equal(c.P.lordRisk,1);assert.equal(c.P.revive,0);
});
test('first main God rebirth doll initializes a finite revive count',()=>{
 const c=world(resetFns);c.runMode36='mainGod';c.save.mainGod.rebirthDoll=1;c.resetP();assert.equal(c.P.revive,1);assert.ok(Number.isFinite(c.P.hp));
});
test('starting a new run discards previous enemies from spatial queries',()=>{
 const c=world([...resetFns,'startGame']),noop=()=>{};
 const gridStart=html.indexOf('  class Grid {'),gridEnd=html.indexOf('  function caps()',gridStart);
 vm.runInContext(html.slice(gridStart,gridEnd).replace('  const grid = new Grid(76);','globalThis.grid = new Grid(76);'),c);
 c.state='pause';c.window.performance=c.performance;
 Object.assign(c,{prepareStageEconomy40:noop,updateQuality48:noop,ensureMusic37:noop,ensureAudio:noop,preferLandscape46:noop,opsPaint46:noop,showBanter:noop,scheduleLoop:noop,
  stage:()=>({id:1,short:'test'}),openingDialogue:()=>[],showDialogue:(lines,done)=>done()});
 const previousEnemy={x:c.W/2,y:c.H/2,r:18,hp:1,dead:false};c.enemies=[previousEnemy];c.grid.add(previousEnemy);
 c.startGame();
 assert.equal(c.enemies.length,0);
 assert.equal(c.grid.nearest(c.P.x,c.P.y,150),null,'a skill or auto-attack before the first update must not target the previous run');
 assert.equal(c.grid.within(c.P.x,c.P.y,150).length,0,'the opening skill cannot earn kills or XP from previous enemies');
});
test('XP earned while choosing stays unspent until each next choice',()=>{
 const c=world(['gainXp','applyLevelGain36','openLevel']);Object.assign(c.P,{level:1,xp:0,next:11,hp:50,maxHp:100});
 c.gainXp(11);c.gainXp(18);c.gainXp(27);assert.equal(c.P.level,2);assert.equal(c.P.xp,45);assert.equal(c.choices,1);
 c.state='play';c.gainXp(0);assert.equal(c.P.level,3);assert.equal(c.choices,2);
 c.state='play';c.gainXp(0);assert.equal(c.P.level,4);assert.equal(c.choices,3);assert.equal(c.P.xp,0);
});
test('testimony and no-upgrade consume all thresholds exactly once',()=>{
 for(const mode of ['testimony','challenge']){const c=world(['gainXp','applyLevelGain36','openLevel']);Object.assign(c.P,{level:1,xp:0,next:11,hp:50,maxHp:100,noUpgradeChallenge40:mode==='challenge'});if(mode==='testimony')c.runMode36=mode;
 c.gainXp(56);assert.equal(c.P.level,4);assert.equal(c.P.xp,0);assert.equal(c.state,'play');assert.equal(c.choices,0);assert.ok(Math.abs(c.P.hp-55.4)<1e-9);c.gainXp(0);assert.ok(Math.abs(c.P.hp-55.4)<1e-9);
 }
});
test('fixedUpdate returns before any work after play has ended',()=>{const c=world(['fixedUpdate']);c.state='result';Object.defineProperty(c,'runTime',{get:()=>5,set:()=>assert.fail('inactive fixedUpdate changed runTime')});c.fixedUpdate(1/60);assert.equal(c.runTime,5);});
test('Aya second skill slash follows game time, pauses, and is cleared on a new run',()=>{
 const c=world([...resetFns,'fixedUpdate']);c.resetP();
 const hits=[],timers=[];
 Object.assign(c,{char35:()=>({id:'aya'}),skill(){},slash35:(radius,damage)=>hits.push({radius,damage}),setTimeout:callback=>timers.push(callback),pushBullet(){},
  runTime:0,banterTick:0,keys:{},joy:{dx:0,dy:0},enemies:[],bullets:[],ebullets:[],gems:[],parts:[],texts:[],slashes:[],bossBorn:true,boss:null,eventIndex:2,shake:0,TAU:Math.PI*2,
  playBanter(){},playToast(){},clamp:(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),PLAYER_GEOMETRY35:{edgeX:28,edgeTop:73,edgeBottom:22},stage:()=>({dur:1000}),grid:{clear(){},add(){},near(){return[];}},updateArenaHazards(){},updateHud(){}});
 const start=html.indexOf('  const _skill35=skill;');
 vm.runInContext(html.slice(start,html.indexOf('  function drawChar35(',start)),c);
 c.P.fire=100;c.P.plan={rank:'A'};c.skill();
 assert.equal(hits.length,1);
 c.fixedUpdate(.06);assert.equal(hits.length,1,'second slash must wait 120ms of game time');
 c.state='pause';c.fixedUpdate(.5);assert.equal(hits.length,1,'pause cannot consume the pending slash');
 c.state='play';c.fixedUpdate(.061);assert.equal(hits.length,2,'second slash fires after resumed game time');
 assert.equal(hits[1].radius,190);assert.equal(timers.length,0,'skill cannot leave a wall-clock callback outside its run');
 c.P.skill=0;c.skill();c.resetP();c.P.fire=100;c.P.plan={rank:'A'};c.fixedUpdate(.2);
 assert.equal(hits.length,3,'reset discards the previous run pending slash');
});
test('fixedUpdate picks one XP gem, stops for its choice, and keeps other gems',()=>{
 const c=world([...resetFns,'gainXp','applyLevelGain36','openLevel','fixedUpdate']);c.resetP();
 Object.assign(c,{runTime:0,banterTick:0,keys:{},joy:{dx:0,dy:0},enemies:[],bullets:[],ebullets:[],parts:[],texts:[],slashes:[],bossBorn:true,boss:null,eventIndex:2,shake:0,TAU:Math.PI*2,
  playBanter:()=>{},playToast:()=>{},clamp:(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),PLAYER_GEOMETRY35:{edgeX:28,edgeTop:73,edgeBottom:22},stage:()=>({dur:1000}),grid:{clear(){},add(){},near(){return[];}},updateArenaHazards:()=>{},updateHud:()=>{}});
 c.P.fire=100;c.P.plan={rank:'A'};c.gems=[11,18,27].map(v=>({v,x:c.P.x,y:c.P.y,r:4,bob:0}));
 c.fixedUpdate(1/60);assert.equal(c.state,'level');assert.equal(c.P.level,2);assert.equal(c.gems.length,2);assert.equal(c.P.gemCount,1);
 c.state='play';c.fixedUpdate(1/60);assert.equal(c.P.level,3);assert.equal(c.gems.length,1);
 c.state='play';c.fixedUpdate(1/60);assert.equal(c.P.level,4);assert.equal(c.gems.length,0);assert.equal(c.choices,3);
});
test('finish rejects duplicate challenge credit and balance sample at the entry',()=>{
 for(const mode of ['story','mainGod']){
  const c=world(['finish','applyChallengeFinish37','applyFinishAwards40','applyFinishReport40','recordBalance40']);c.runMode36=mode;c.runTime=1;
  Object.assign(c.P,{mgChallenge:{id:'test',bonus:3,ok:()=>true},kills:0,level:1,damageTaken:0});Object.assign(c.save,{balance40:{samples:[]},runHistory:[],runs:0});
  c.setMusic37=()=>{};c.paintOutfitModal45=()=>{};c.paintTrialResult46=()=>{};c.persist=()=>{};
  c.finishStoryRun=c.finishMainGod36=()=>{c.state='result';c.save.runs++;};
  c.finish(true);const count=c.save.balance40.samples.length,challenge=c.save.mainGod.challenges.test;
  c.finish(true);assert.equal(c.save.runs,1);assert.equal(c.save.balance40.samples.length,count);assert.equal(c.save.mainGod.challenges.test,challenge);
  if(mode==='story')assert.equal(count,1);else assert.equal(challenge,1);
 }
});
test('a level-triggering twelfth gem still applies its transmutation reward',()=>{
 const c=world([...resetFns,'gainXp','applyLevelGain36','openLevel','fixedUpdate']);c.resetP();let transmutations=0;
 Object.assign(c,{runTime:0,banterTick:0,keys:{},joy:{dx:0,dy:0},enemies:[],bullets:[],ebullets:[],parts:[],texts:[],slashes:[],bossBorn:true,boss:null,eventIndex:2,shake:0,TAU:Math.PI*2,
  playBanter:()=>{},playToast:()=>{},clamp:(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),PLAYER_GEOMETRY35:{edgeX:28,edgeTop:73,edgeBottom:22},stage:()=>({dur:1000}),grid:{clear(){},add(){},near(){return[];}},updateArenaHazards:()=>{},updateHud:()=>{},aoe:()=>transmutations++});
 Object.assign(c.P,{fire:100,plan:{rank:'A'},gemCount:11,transmute:1,maxSh:20});c.gems=[{v:11,x:c.P.x,y:c.P.y,r:4,bob:0}];
 c.fixedUpdate(1/60);assert.equal(c.state,'level');assert.equal(transmutations,1);assert.equal(c.P.sh,18);assert.equal(c.gems.length,0);
});

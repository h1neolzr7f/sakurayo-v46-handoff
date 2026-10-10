import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const source=fs.readFileSync(process.env.SAKURAYO_ENTRY || process.argv[2] || new URL('../src/index.html',import.meta.url),'utf8');
function fn(name){const start=source.indexOf(`  function ${name}(`);assert.ok(start>=0,name);const end=source.indexOf('\n  function ',start+4);return source.slice(start,end);}
function fixture(){
 const no=()=>{};
 const s={window:{},Math,Object,Number,Map,Set,Array,quality:1,look46:{},W:932,H:430,TAU:Math.PI*2,state:'play',runTime:0,banterTick:0,spawnClock:999,bossBorn:true,boss:null,eventIndex:2,shake:0,keys:{},joy:{dx:0,dy:0},P:{},save:{ach:{},tal:{flow:0,hp:0,atk:0,mag:0,luck:0},character:'rion',skin:'default',storyChoices38:{},shop40:{starter:{},items:{}}},enemies:[],bullets:[],ebullets:[],pets:[],gems:[],parts:[],texts:[],slashes:[],PLAYER_GEOMETRY35:{edgeX:16,edgeTop:16,edgeBottom:16},
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),chance:()=>false,rnd:(a,b)=>(a+b)/2,stage:()=>({id:1,dur:999,scale:1}),isMainGodRun36:()=>false,enemyDamageMul:()=>1,healingMul:()=>1,planFactor:()=>1,directorIntensity:()=>1,phaseIndex:()=>0,nearest:()=>null,char35:()=>({id:'rion'}),setForm:no,refreshPlan:no,
 playBanter:no,playToast:no,showBanter:no,toast:no,shoot:no,particles:no,textsPush:no,fxStamp:no,sound:no,lightning:no,partsPush:no,draw:no,bossDefeated:no,updateArenaHazards:no,updateHud:no,midEvent:no,spawnBoss:no,finish:no,lifecycleWorld44:()=>({}),
 // Presentation and empty-loadout dependencies; run initializers below stay real.
 artImage:no,charAnimPath35:()=>'',updateCharacterUI35:no,starterChapterMul40:()=>1};
 vm.createContext(s);
 const gs=source.indexOf('  class Grid {'),ge=source.indexOf('  function caps()',gs);
 vm.runInContext(source.slice(gs,ge).replace('  const grid = new Grid(76);','globalThis.grid = new Grid(76);'),s);
 for(const name of ['resetP','caps','pushBullet','enemyShot','radialBossShot','damageEnemy','killEnemy','damagePlayer','aoe','fixedUpdate','spawnBossAdds','bossSpecial','directionalSlash36','skill','dash','updateEnemyRoles39','circlesOverlap35','angleDelta36','directionalHit36'])vm.runInContext(fn(name),s);
 // These one-line definitions are followed by unrelated UI/combat installation
 // hooks, so extract the initializer itself rather than the surrounding block.
 for(const name of ['applyCharacterRun35','applyMainGodRun36','applyMainGodChallenge37','storyMemory38','applyStoryRun38','applyCombatRun39','applyShopRun40','applyFusionRun41']){
  const line=source.split('\n').find(l=>l.startsWith(`  function ${name}(`));
  assert.ok(line,name);vm.runInContext(line,s);
 }
 if(source.includes('  function pushEnemyBullet('))vm.runInContext(fn('pushEnemyBullet'),s);
 vm.runInContext(source.slice(source.indexOf('  const MAIN_GOD_CHALLENGES37='),source.indexOf('  function randomOffers37('))+'\nglobalThis.challenges=MAIN_GOD_CHALLENGES37;',s);
 s.resetP();
 // Preserve the neutral hit-test baseline after real rion setup; character
 // balance is covered elsewhere and must not change collision expectations.
 Object.assign(s.P,{hp:100,maxHp:100,dmg:18,spd:220,damageReduce:0,range:620,rate:.45,skillCd:7,fire:999,planClock:999,fusionClock:999,x:400,y:200});
 return s;
}
function enemy(extra={}){return {type:'normal',x:500,y:200,r:15,hp:1e6,max:1e6,spd:0,dmg:20,xp:1,acid:0,infected:0,touch:0,frozen:0,hit:0,shot:999,...extra};}
function bullet(extra={}){return {x:500,y:200,r:4,vx:0,vy:0,life:1,dmg:20,pierce:0,source:'shot',hit:new Set(),...extra};}
for(const faction of ['bullets','ebullets'])for(const condition of ['deflected','expired'])test(`${faction} ${condition} cannot hit a overlapping target`,()=>{
 const s=fixture();s.enemies=[enemy({touch:999})];s.P.x=500;s[faction]=[bullet({life:condition==='expired'?.001:1})];if(condition==='deflected')s.window.SakurayoLifecycle={resolvePlayer:(x,y)=>({x,y,slow:1,melee:1}),spawnInterval:x=>x,ensureMinCrowd:()=>0,deflectBullet:()=>1};
 s.fixedUpdate(.01);assert.equal(s.enemies[0].hp,1e6);assert.equal(s.P.hp,100);
});
test('acid and spore preserve fractional damage independent of fixed step',()=>{for(const steps of [30,60,120]){const s=fixture(),e=enemy();s.P.acid=1;s.P.spore=1;for(let i=0;i<steps;i++){s.damageEnemy(e,2.9/steps,{source:'acid',crit:false});s.damageEnemy(e,2.75/steps,{source:'spore',crit:false});}assert.ok(Math.abs((1e6-e.hp)-5.65)<1e-6);}});
test('enemy bomb damages player and leaves adjacent enemy untouched',()=>{const s=fixture(),bomb=enemy({type:'bomb',x:400,hp:50}),near=enemy({x:450});s.enemies=[bomb,near];s.fixedUpdate(.01);assert.equal(s.P.hp,80);assert.equal(s.P.damageTaken,20);assert.equal(near.hp,1e6);assert.equal(bomb.dead,true);});
test('bioSplit is forwarded through real bullet kill to split projectiles',()=>{const s=fixture();s.P.bioGun=1;s.enemies=[enemy({hp:5})];s.bullets=[bullet({bioSplit:true})];s.fixedUpdate(.01);assert.equal(s.bullets.length,2);assert.ok(s.bullets.every(b=>b.bioSplit===false));});
test('single-core challenge counts real formed careers',()=>{const s=fixture();s.P.careers={gun:{formed:1},mage:{formed:1},summon:{formed:1}};assert.equal(s.challenges.find(c=>c.id==='specialist').ok(),false);delete s.P.careers.summon;assert.equal(s.challenges.find(c=>c.id==='specialist').ok(),true);});
test('directional blade multiplier is applied once',()=>{const s=fixture(),e=enemy({x:420});s.enemies=[e];s.grid.add(e);s.P.bladePower=1.18;s.directionalSlash36(100,100,false,0);assert.ok(Math.abs((1e6-e.hp)-118)<1e-8);});
for(const kind of ['drone','bat','familiar','wisp'])test(`${kind} pet multiplier is applied once at damage settlement`,()=>{const s=fixture();s.P.petPow=1.22;s.P[kind]=1;s.P.dmg=18;s.nearest=()=>s.enemies[0];s.enemies=[enemy({x:700})];s.pets=[{kind,i:0,clock:0}];s.fixedUpdate(.01);const b=s.bullets[0];assert.ok(b.pet,'projectile carries pet identity across tech/bio source');const amount=s.damageEnemy(s.enemies[0],b.dmg,{source:b.source,pet:b.pet,crit:false});const base=18*({drone:.45,bat:.38,familiar:.5,wisp:.46}[kind]);assert.ok(Math.abs(amount-base*1.22)<1e-8);});
test('boss radius broad phase includes cross-cell overlapping bullet',()=>{const s=fixture(),e=enemy({type:'boss',phase:1,special:999,r:58,x:152});s.enemies=[e];s.bullets=[bullet({x:89,r:7})];s.fixedUpdate(.01);assert.equal(e.hp,1e6-20);});
test('enemy burst and radial shots obey cap for every enqueue',()=>{const s=fixture();s.ebullets=Array.from({length:83},()=>bullet());s.enemyShot(enemy({type:'boss',phase:4}));assert.equal(s.ebullets.length,84);s.radialBossShot(enemy(),30);assert.equal(s.ebullets.length,84);});
test('Grid within rejects cell corner neighbors and nearest ignores dead enemies',()=>{const s=fixture(),near=enemy({x:70,y:0}),far=enemy({x:75,y:75}),dead=enemy({x:1,y:1,dead:true});for(const e of [near,far,dead])s.grid.add(e);assert.equal(typeof s.grid.within,'function','bounded exact circle query exists');assert.deepEqual(Array.from(s.grid.within(0,0,80)),[near]);assert.equal(s.grid.nearest(0,0,80),near);s.grid.clear();assert.equal(s.grid.maxRadius,0);});
test('homing bullets use bounded grid nearest after rebuild',()=>{const s=fixture();s.enemies=[enemy({x:550})];let calls=0;s.nearest=()=>{calls++;return s.enemies[0]};s.bullets=Array.from({length:40},()=>bullet({home:.1,vx:100}));s.fixedUpdate(.01);assert.equal(calls,0);});
test('aoe radius includes a large boss across a cell boundary',()=>{const s=fixture(),e=enemy({x:228,r:90,type:'boss'});s.grid.add(e);s.aoe(100,200,40,10);assert.equal(e.hp,1e6-10);});
test('boss guards spawn around boss in world bounds',()=>{const s=fixture();s.window.SakurayoCamera={size:()=>({worldW:3728,worldH:860})};s.boss=enemy({x:1800,y:500});s.spawnEnemy=()=>s.enemies.push(enemy());s.spawnBossAdds('shield',4,true);assert.ok(s.enemies.every(e=>e.x>=1690&&e.x<=1910&&e.y>=410&&e.y<=590));});
test('chapter 2 teleport remains in world near current encounter',()=>{const s=fixture();s.stage=()=>({id:2});s.window.SakurayoCamera={size:()=>({worldW:3728,worldH:860})};s.P.x=1800;s.P.y=500;const e=enemy({type:'boss',phase:2,x:1800,y:500});s.bossSpecial(e);assert.ok(e.x>932,'boss stays in player world region');assert.ok(e.x>=e.r&&e.x<=3728-e.r&&e.y>=e.r&&e.y<=860-e.r);});

test('real fixedUpdate DOT yields equal totals at 30/60/120Hz',()=>{for(const steps of [30,60,120]){const s=fixture(),e=enemy({acid:2,infected:2});s.enemies=[e];s.P.acid=s.P.spore=1;for(let i=0;i<steps;i++)s.fixedUpdate(1/steps);assert.ok(Math.abs((1e6-e.hp)-5.65)<1e-6);}});
test('aoe summon identity reaches damage settlement',()=>{const s=fixture(),e=enemy();s.grid.add(e);s.P.petPow=1.22;s.aoe(e.x,e.y,30,10,'#fff',false,{source:'spell',school:'summon',pet:true});assert.ok(Math.abs((1e6-e.hp)-12.2)<1e-8);});
test('spore spread and plague do not affect cell corner enemies',()=>{for(const mode of ['spread','plague','necroSpore']){const s=fixture(),victim=enemy({x:10,y:10,infected:2}),far=enemy({x:145,y:145});s.P[mode]=1;s.chance=()=>true;s.enemies=[victim,far];s.grid.add(victim);s.grid.add(far);s.killEnemy(victim);assert.equal(far.infected,0,mode);assert.equal(far.acid,0,mode);}});

function circleTargets(s,r){
 // Both targets occupy queried cells; only one lies inside the actual circle.
 s.P.x=s.P.y=0;
 const inside=enemy({x:r-1,y:0}),outside=enemy({x:r-1,y:r-1});
 s.enemies=[inside,outside];for(const e of s.enemies)s.grid.add(e);
 return {inside,outside};
}
test('frost skill only freezes targets inside its circle',()=>{const s=fixture();s.P.frost=1;s.P.skillR=100;const {inside,outside}=circleTargets(s,170);s.skill();assert.ok(inside.frozen>0);assert.equal(outside.frozen,0);});
test('rion skill only freezes targets inside its circle',()=>{const s=fixture();vm.runInContext(source.split('\n').find(l=>l.startsWith('  skill=function(){let c=char35();')),s);s.slash35=()=>{};const {inside,outside}=circleTargets(s,260);s.skill();assert.ok(inside.frozen>0);assert.equal(outside.frozen,0);});
for(const fusion of ['plagueforge','flowerplague','necrospore'])test(`${fusion} burst rejects circular range cell corners`,()=>{const s=fixture();s.P.fusion=fusion;s.P.fusionClock=0;s.P.sporeR=100;const r={plagueforge:180,flowerplague:200,necrospore:220}[fusion],{inside,outside}=circleTargets(s,r);s.fixedUpdate(.01);assert.ok(inside.infected>0);assert.equal(outside.infected,0);assert.equal(outside.acid,0);});
test('purifier cleanse only clears ailments inside its circle',()=>{const s=fixture(),p=enemy({type:'purifier',x:0,y:0,cleanse:0}),near=enemy({x:119,y:0,acid:2,infected:2}),far=enemy({x:145,y:145,acid:2,infected:2});s.P.x=400;s.enemies=[p,near,far];s.fixedUpdate(.01);assert.equal(near.acid,0);assert.equal(near.infected,0);assert.ok(far.acid>0&&far.infected>0);});
test('purifier healing only affects enemies inside its circle',()=>{const s=fixture(),p=enemy({type:'purifier',x:0,y:0,roleCd39:0}),near=enemy({x:124,y:0,hp:50,max:100}),far=enemy({x:145,y:145,hp:50,max:100});s.enemies=[p,near,far];for(const e of s.enemies)s.grid.add(e);s.updateEnemyRoles39(.01);assert.equal(near.hp,52.5);assert.equal(far.hp,50);});
for(const fusion of ['elementalBeast41','plagueIdol41'])test(`${fusion} secondary ailments stay inside circle`,()=>{const s=fixture();s._update41=()=>{};vm.runInContext(source.split('\n').find(l=>l.startsWith('  update=function(dt){const result=_update41(dt);')),s);s.P[fusion]=1;s.P.fusionClock41=0;s.P.fusionPulse41=0;const {inside,outside}=circleTargets(s,fusion==='elementalBeast41'?145:135);s.update(.01);if(fusion==='elementalBeast41'){assert.ok(inside.frozen>0);assert.equal(outside.frozen,0);}else{assert.ok(inside.acid>0);assert.equal(outside.acid,0);}});
for(const pulse of [0,1,2])test(`elemental beast pulse ${pulse} applies pet multiplier once for every source`,()=>{const s=fixture();s._update41=()=>{};vm.runInContext(source.split('\n').find(l=>l.startsWith('  update=function(dt){const result=_update41(dt);')),s);s.P.elementalBeast41=1;s.P.fusionClock41=0;s.P.petPow=1.22;s.P.familiar=2;s.P.fusionPulse41=(pulse+2)%3;const e=enemy({x:410});s.grid.add(e);s.update(.01);assert.ok(Math.abs((1e6-e.hp)-18*(.78+2*.08)*1.22)<1e-8);});

test('orbit hits enemy that enters its radius across a grid cell during this fixed step',()=>{
 const s=fixture(),e=enemy({x:152.2,y:200,r:18,spd:56});
 s.P.x=58.5;s.P.y=200;s.P.orbit=1;s.P.angle=-2.25/60;s.enemies=[e];
 s.fixedUpdate(1/60);
 assert.ok(Math.abs(e.x-151.26666666666665)<1e-9);
 assert.ok(Math.abs((1e6-e.hp)-11.52)<1e-8);
});
test('spore aura includes enemy that moved across a grid cell into its circle',()=>{
 const s=fixture(),e=enemy({x:152.2,y:200,r:18,spd:56});
 s.P.x=58.5;s.P.y=200;s.P.spore=1;s.P.sporeR=93;s.enemies=[e];
 s.fixedUpdate(1/60);
 assert.equal(e.infected,.25);
});
for(const purifierFirst of [true,false])test(`purifier uses post-movement enemy positions independent of array order (${purifierFirst})`,()=>{
 const s=fixture(),p=enemy({type:'purifier',x:31.5,y:200,cleanse:0,touch:999}),e=enemy({x:152.2,y:200,r:18,spd:56,acid:2,infected:2});
 s.P.x=58.5;s.P.y=200;s.enemies=purifierFirst?[p,e]:[e,p];
 s.fixedUpdate(1/60);
 assert.equal(e.acid,0);assert.equal(e.infected,0);
});

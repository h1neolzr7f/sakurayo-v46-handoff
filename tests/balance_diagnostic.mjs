// Balance diagnostic with three player proxies (SAKURAYO_AGENTS, default "stand"):
//   stand – original gate: no in-run upgrades, player stands still (threshold ≤1.30)
//   kite  – moves: dodges the nearest enemies (keeps the boss at ~80% weapon range) and walks to gems (no upgrades)
//   build – kite movement + takes level-up choices (recommended card first)
// All proxies are protected from death so the metric is clear time.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const entry=path.resolve(process.env.SAKURAYO_ENTRY||process.argv[2]||'src/index.html');
const agents=(process.env.SAKURAYO_AGENTS||'stand').split(',').map(v=>v.trim()).filter(Boolean);
const browser=await chromium.launch({headless:true});
try{
 const seeds=(process.env.SAKURAYO_SEEDS||'0x40c0de').split(',').map(v=>Number(v.trim())).filter(Number.isFinite);
 const evidence=[],summary=[];
 for(const agent of agents)for(const seed of seeds){const rows=[];
 for(const character of ['sayo','aya','rion']){
  const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('sakurayoV3',JSON.stringify({coins:0,unlock:4,tutorialDone:true})));
  const page=await context.newPage();
  await page.goto(pathToFileURL(entry).href+'?test=1');
  await page.locator('.bootArt35').waitFor({state:'detached'});
  const result=await page.evaluate(async({character,seed,agent})=>{
   const a=window.__SAKURAYO_TEST__,get=()=>JSON.parse(window.render_game_to_text());
   a.selectCharacter(character);a.configureStarter40('assault',5,agent!=='build');a.selectStage(4);a.reseed40(seed);a.start();a.dismissDialogue();a.protectPlayer();
   const keys={w:0,a:0,s:0,d:0};
   const press=(k,on)=>{if(keys[k]===on)return;keys[k]=on;window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{key:k,bubbles:true}));};
   const steer=()=>{const f=a.fieldProbe(8);let vx=0,vy=0;
    for(const e of f.enemies){const d=Math.hypot(e.dx,e.dy)||1,reach=e.boss?Math.max(150,Math.min(240,(f.range||240)*.8)):150;if(d<reach){const w=(reach-d)/reach*(e.boss?3:2);vx-=e.dx/d*w;vy-=e.dy/d*w;vx+=-e.dy/d*w*.6;vy+=e.dx/d*w*.6;}}
    const g=f.gems[0];if(g){const d=Math.hypot(g.dx,g.dy)||1;if(d<420){vx+=g.dx/d*1.2;vy+=g.dy/d*1.2;}}
    const m=90;if(f.x<m)vx+=1;if(f.x>f.worldW-m)vx-=1;if(f.y<m)vy+=1;if(f.y>f.worldH-m)vy-=1;
    press('d',vx>.35);press('a',vx<-.35);press('s',vy>.35);press('w',vy<-.35);};
   const start=get();let s=start;const events=[];let picks=0,bossAt=null;const bossLog=[];
   const step=agent==='stand'?5000:250,limit=agent==='stand'?100:2400;
   for(let i=0;i<limit&&s.mode!=='result';i++){
    if(s.mode==='event'){events.push({title:document.querySelector('#eventTitle').textContent});a.chooseEvent(0);}
    else if(s.mode==='dialogue')a.dismissDialogue();
    else if(s.mode==='level'){const c=[...document.querySelectorAll('#choices .choice')];(c.find(b=>b.dataset.rec==='1')||c[0]).click();picks++;}
    else if(s.mode==='play'){if(agent!=='stand')steer();if(s.player.skillCooldown<=0)document.querySelector('#skill').click();await window.advanceTime(step);}
    else throw new Error(s.mode);
    s=get();if(bossAt==null&&s.boss&&s.boss.hp!=null)bossAt=s.runTime;if(s.boss&&i%8===0)bossLog.push([+(s.runTime-(bossAt||0)).toFixed(0),s.boss.phase,+(s.boss.ratio).toFixed(2),s.boss.guard]);
   }
   for(const k of Object.keys(keys))press(k,0);
   return {character,agent,start,events,picks,bossAt,bossLog,end:s};
  },{character,seed,agent});
  result.seed=seed;evidence.push(result);rows.push(result);assert.equal(result.end.mode,'result');assert.equal(result.end.result.win,true);
  console.log(agent,'seed',seed.toString(16),character,result.end.runTime,'Lv',result.end.player.level,'picks',result.picks,'boss',result.bossAt==null?'-':(result.end.runTime-result.bossAt).toFixed(1)+'s');if(process.env.SAKURAYO_BOSSLOG)console.log(JSON.stringify(result.bossLog));
  await context.close();
 }
 const d=rows.map(r=>r.end.runTime),ratio=Math.max(...d)/Math.min(...d);summary.push({agent,seed,ratio,times:Object.fromEntries(rows.map(r=>[r.character,r.end.runTime]))});console.log(agent,'seed',seed.toString(16),'max/min',ratio.toFixed(4));
 }
 fs.mkdirSync('tests/artifacts/continuation',{recursive:true});
 fs.writeFileSync('tests/artifacts/continuation/balance-diagnostic.json',JSON.stringify(evidence,null,2));
 fs.writeFileSync('tests/artifacts/continuation/balance-summary.json',JSON.stringify(summary,null,2));
 const gate=summary.filter(r=>r.agent==='stand');
 if(gate.length)console.log('Fresh-save max/min duration ratio',Math.max(...gate.map(r=>r.ratio)),JSON.stringify(gate));
 for(const ag of agents.filter(x=>x!=='stand'))console.log(`[${ag}] max/min (reference)`,Math.max(...summary.filter(r=>r.agent===ag).map(r=>r.ratio)).toFixed(4));
}finally{await browser.close();}

import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const entry=path.resolve(process.env.SAKURAYO_ENTRY||process.argv[2]||'src/index.html');
const browser=await chromium.launch({headless:true});
try{
 const seeds=(process.env.SAKURAYO_SEEDS||'0x40c0de').split(',').map(v=>Number(v.trim())).filter(Number.isFinite);
 const evidence=[],summary=[];
 for(const seed of seeds){const rows=[];
 for(const character of ['sayo','aya','rion']){
  const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('sakurayoV3',JSON.stringify({coins:0,unlock:4,tutorialDone:true})));
  const page=await context.newPage();
  await page.goto(pathToFileURL(entry).href+'?test=1');
  await page.locator('.bootArt35').waitFor({state:'detached'});
  const result=await page.evaluate(async({character,seed})=>{
   const a=window.__SAKURAYO_TEST__,get=()=>JSON.parse(window.render_game_to_text());
   a.selectCharacter(character);a.configureStarter40('assault',5,true);a.selectStage(4);a.reseed40(seed);a.start();a.dismissDialogue();a.protectPlayer();
   const start=get();let s=start;const events=[];
   for(let i=0;i<100&&s.mode!=='result';i++){
    if(s.mode==='event'){events.push({title:document.querySelector('#eventTitle').textContent,choices:document.querySelector('#eventChoices')?.textContent});a.chooseEvent(0);}
    else if(s.mode==='dialogue')a.dismissDialogue();
    else if(s.mode==='play'){if(s.player.skillCooldown<=0)document.querySelector('#skill').click();await window.advanceTime(5000);}
    else throw new Error(s.mode);
    s=get();
   }
   return {character,start,events,end:s};
  },{character,seed});
  result.seed=seed;evidence.push(result);rows.push(result);assert.equal(result.end.mode,'result');assert.equal(result.end.result.win,true);
  console.log('seed',seed.toString(16),character,result.end.runTime,JSON.stringify({damage:result.start.player.attackDamage,rate:result.start.player.attackInterval,events:result.events}));
  await context.close();
 }
 const d=rows.map(r=>r.end.runTime),ratio=Math.max(...d)/Math.min(...d);summary.push({seed,ratio});console.log('seed',seed.toString(16),'max/min',ratio.toFixed(4));
 }
 fs.mkdirSync('tests/artifacts/continuation',{recursive:true});
 fs.writeFileSync('tests/artifacts/continuation/balance-diagnostic.json',JSON.stringify(evidence,null,2));
 console.log('Fresh-save max/min duration ratio',Math.max(...summary.map(r=>r.ratio)),JSON.stringify(summary));
}finally{await browser.close();}

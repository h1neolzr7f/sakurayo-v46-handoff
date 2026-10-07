import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const entry=path.resolve(process.env.SAKURAYO_ENTRY||process.argv[2]||'src/index.html');
const browser=await chromium.launch({headless:true});
try{
 const evidence=[];
 for(const character of ['sayo','aya','rion']){
  const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('sakurayoV3',JSON.stringify({coins:0,unlock:4,tutorialDone:true})));
  const page=await context.newPage();
  await page.goto(pathToFileURL(entry).href+'?test=1');
  await page.locator('.bootArt35').waitFor({state:'detached'});
  const result=await page.evaluate(async(character)=>{
   const a=window.__SAKURAYO_TEST__,get=()=>JSON.parse(window.render_game_to_text());
   a.selectCharacter(character);a.configureStarter40('assault',5,true);a.selectStage(4);a.reseed40(0x40c0de);a.start();a.dismissDialogue();a.protectPlayer();
   const start=get();let s=start;const events=[];
   for(let i=0;i<100&&s.mode!=='result';i++){
    if(s.mode==='event'){events.push({title:document.querySelector('#eventTitle').textContent,choices:document.querySelector('#eventChoices')?.textContent});a.chooseEvent(0);}
    else if(s.mode==='dialogue')a.dismissDialogue();
    else if(s.mode==='play'){if(s.player.skillCooldown<=0)document.querySelector('#skill').click();await window.advanceTime(5000);}
    else throw new Error(s.mode);
    s=get();
   }
   return {character,start,events,end:s};
  },character);
  evidence.push(result);assert.equal(result.end.mode,'result');assert.equal(result.end.result.win,true);
  console.log(character,result.end.runTime,JSON.stringify({damage:result.start.player.attackDamage,rate:result.start.player.attackInterval,events:result.events}));
  await context.close();
 }
 fs.mkdirSync('tests/artifacts/continuation',{recursive:true});
 fs.writeFileSync('tests/artifacts/continuation/balance-diagnostic.json',JSON.stringify(evidence,null,2));
 const durations=evidence.map(row=>row.end.runTime);
 console.log('Fresh-save max/min duration ratio',Math.max(...durations)/Math.min(...durations));
}finally{await browser.close();}

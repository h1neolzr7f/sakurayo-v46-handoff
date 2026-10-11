// UI 动效总览录像（约 60 秒）：加载 → 大厅视差 → 底栏图标 → 各子页 → 角色出场 → 出击闪屏 → 战斗 HUD → 结算 → 射的/夜行。
// 用法：node tools/record_ui_tour.mjs <输出目录>，得到 webm，再用 ffmpeg 转 mp4。
import {chromium} from 'playwright';import path from 'node:path';import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const out=process.argv[2]||'/tmp/tour';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--allow-file-access-from-files']});
const ctx=await b.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
await ctx.addInitScript(()=>localStorage.setItem('sakurayoV3',JSON.stringify({coins:2400,unlock:5,done:[1,2,3,4],tutorialDone:true,character:'sayo'})));
const p=await ctx.newPage();const url=pathToFileURL(path.resolve('src/index.html')).href+'?test=1';const W=ms=>p.waitForTimeout(ms);
const api=(fn,...a)=>p.evaluate(([fn,a])=>window.__SAKURAYO_TEST__[fn](...a),[fn,a]);
await p.goto(url);await W(400);for(const [x,y] of [[400,300],[700,420],[900,250]]){await p.mouse.click(x,y);await W(500);}
await p.locator('.bootArt35').waitFor({state:'detached'});await W(800);
for(const [x,y] of [[150,150],[1150,600],[200,650],[1100,120],[640,360]])await p.mouse.move(x,y,{steps:25});await W(600);
for(const k of ['gacha','roster','shop','stage','trials','archive']){const btn=p.locator(`.homeNav46 [data-open="${k}"]`);await btn.hover();await W(300);await btn.click();await W(1700);await p.evaluate(()=>document.querySelectorAll('.drawer:not(.hidden) .close').forEach(x=>x.click()));await W(600);}
await p.evaluate(()=>window.SakurayoFx?.showcase('朝雾绫'));await W(2400);
await p.evaluate(()=>window.SakurayoFx?.showcase('黑羽凛音'));await W(2400);
await p.evaluate(()=>window.SakurayoPolish?.reward({rarity:'SSR',title:'夜樱突击步枪 · 改',icon:'✦',desc:'传说武器'}));await W(2500);
await p.locator('#start').hover();await W(400);await p.evaluate(()=>window.SakurayoFx?.startFx());await W(1500);
await p.goto(url);await p.locator('.bootArt35').waitFor({state:'detached'});
try{await api('openPachi46',{seed:3});await W(3000);await api('backMenu');}catch(e){}
try{await api('openNight46');await W(3000);await api('backMenu');}catch(e){}
await p.goto(url);await p.locator('.bootArt35').waitFor({state:'detached'});await W(300);
await p.evaluate(()=>{const t=window.__SAKURAYO_TEST__;t.selectCharacter?.('sayo');t.selectStage?.(1);t.start?.();t.dismissDialogue?.();t.protectPlayer?.();});await W(800);
const hold=async(k,ms)=>{await p.keyboard.down(k);await W(ms);await p.keyboard.up(k);};
for(let i=0;i<3;i++){await hold('KeyD',900);await hold('KeyW',800);await hold('KeyA',900);await hold('KeyS',800);}
await p.evaluate(()=>{const s=(id,t)=>{const e=document.getElementById(id);if(e)e.textContent=t};s('rankBig','S');s('rtitle','防线守住了');const r=document.getElementById('rstats');if(r)r.innerHTML='<div>击破 <b>1,284</b></div><div>存活 <b>302</b> 秒</div><div>樱花币 <b>+460</b></div>';document.getElementById('result')?.classList.remove('hidden');});await W(4000);
const v=p.video();await ctx.close();await b.close();fs.renameSync(await v.path(),path.join(out,'tour.webm'));console.log('ok');

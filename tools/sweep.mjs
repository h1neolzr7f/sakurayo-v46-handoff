// 截图巡检：全部界面 × 三种尺寸（1280×720 / 844×390 / 390×844）。战斗类切实时时钟并取多帧。
// 用法：node tools/sweep.mjs <输出目录> [场景名过滤]；输出 PNG + report.json（控制台报错、404、溢出元素、FPS）
import {chromium} from 'playwright';import path from 'node:path';import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const out=process.argv[2]||'/tmp/sweep';const only=process.argv[3];fs.mkdirSync(out,{recursive:true});
const URL=pathToFileURL(path.resolve('src/index.html')).href+'?test=1';
const VPS=[['d',1280,720],['l',844,390],['p',390,844]];
const SAVE={coins:2400,unlock:5,done:[1,2,3,4],tutorialDone:true,character:'sayo'};
const W=(p,ms)=>p.waitForTimeout(ms);const T=(p,code,...a)=>p.evaluate(([c,a])=>window.__SAKURAYO_TEST__[c](...a),[code,a]);
const drawer=k=>async p=>{await T(p,'openDrawer',k);await W(p,900);};
const S={
  lobby:async p=>{await W(p,600);},
  stage:drawer('stage'),story:drawer('story'),talent:drawer('talent'),ach:drawer('ach'),shop:drawer('shop'),gacha:drawer('gacha'),roster:drawer('roster'),trials:drawer('trials'),archive:drawer('archive'),asc:drawer('asc'),
  wardrobe:async p=>{await T(p,'openWardrobe46');await W(p,900);},
  night:async p=>{await T(p,'openNight46');await W(p,900);},
  runmap:async p=>{await T(p,'runStart46',7);await W(p,900);},
  levelmap:async p=>{await p.evaluate(()=>document.getElementById('levelMapBtn46')?.click());await W(p,900);},
  shateki:async p=>{await T(p,'openPachi46',{seed:3});await W(p,500);await T(p,'pachiFire46',0.5,0.4).catch(()=>{});await W(p,700);},
  avg:async p=>{await T(p,'selectStage',1);await T(p,'start');await W(p,2200);await p.evaluate(()=>{const a=document.querySelector('#dialogue .dialogueArt');if(a){/* nudge repaint after avg preload */ a.style.opacity=.999;requestAnimationFrame(()=>a.style.opacity='');}});await W(p,400);},
  mow:{frames:3,go:async p=>{await T(p,'selectStage',2);await T(p,'start');await T(p,'dismissDialogue');await T(p,'realtime46');await W(p,2500);}},
  levelup:async p=>{await T(p,'selectStage',1);await T(p,'start');await T(p,'dismissDialogue');await T(p,'realtime46');await W(p,1500);await T(p,'triggerUpgrade');await W(p,800);},
  result:async p=>{await T(p,'selectStage',1);await T(p,'start');await T(p,'dismissDialogue');await T(p,'realtime46');await W(p,800);await T(p,'finishNow46',true);await W(p,2200);},
  bosspick:async p=>{await T(p,'runStart46',7);for(let k=0;k<30;k++){const st=await T(p,'runState46');if(st.modal?.kind==='bossmode')break;
    if(st.modal){await T(p,'runChoose46',0).catch(()=>{});await T(p,'runSkipModal46').catch(()=>{});continue;}
    if(['play','sky','duel'].includes(st.mode)){await T(p,'runWinNode46').catch(()=>{});await T(p,'runContinue46').catch(()=>{});continue;}
    await p.evaluate(()=>{try{window.SakurayoDuel?.stop?.()}catch(e){}try{window.SakurayoShmup?.stop?.()}catch(e){}document.querySelectorAll('#duel46,#shm46').forEach(e=>e.remove());});const a=st.available||[];const n=a.find(q=>q.type==='boss')||a.find(q=>!['sky','duel'].includes(q.type))||a[0];if(!n)break;await T(p,'runEnter46',n.id);}await W(p,900);},
  shmup:{frames:3,go:async p=>{await p.evaluate(()=>window.SakurayoShmup.start({character:'sayo',seed:9,layer:3,kind:'boss',auto:true,skill:0.6,route:'tech',power:1.2}));await W(p,2500);}},
  duel:{frames:3,go:async p=>{await p.evaluate(()=>window.SakurayoDuel.start({character:'sayo',seed:5,layer:2,auto:true,skill:0.85,route:'bio',power:1.2}));await W(p,2500);}},
};
const report={};const b=await chromium.launch({args:['--allow-file-access-from-files']});
for(const [name,sc] of Object.entries(S)){ if(only&&!only.split(',').includes(name))continue;
 for(const [v,w,h] of VPS){const key=`${name}_${v}`;const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:v!=='d',isMobile:v!=='d'});
  await ctx.addInitScript(s=>localStorage.setItem('sakurayoV3',JSON.stringify(s)),SAVE);const p=await ctx.newPage();const errs=[],miss=[];
  p.on('pageerror',e=>errs.push(String(e).slice(0,200)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});p.on('requestfailed',r=>miss.push(r.url().split('/').slice(-3).join('/')));p.on('response',r=>{if(r.status()>=400)miss.push(r.status()+' '+r.url().split('/').slice(-3).join('/'));});
  try{await p.goto(URL);await p.locator('.bootArt35').waitFor({state:'detached',timeout:15000});const go=sc.go||sc;await go(p);
   const n=sc.frames||1;for(let i=0;i<n;i++){await p.screenshot({path:`${out}/${key}${n>1?'_'+i:''}.png`});if(i<n-1)await W(p,900);}
   const info=await p.evaluate(async()=>{const vw=innerWidth,vh=innerHeight,o=[];document.querySelectorAll('body *').forEach(e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return;const c=getComputedStyle(e);if(c.visibility==='hidden'||+c.opacity===0)return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
     if(e.children.length===0&&e.textContent.trim()&&(e.scrollWidth>e.clientWidth+2&&c.overflow!=='visible'&&c.textOverflow!=='ellipsis'))o.push('clip:'+(e.id||e.className)+':'+e.textContent.trim().slice(0,16));
     if((e.tagName==='BUTTON')&&(r.right>vw+2||r.bottom>vh+2||r.left<-2||r.top<-2))o.push('offscreen:'+(e.id||e.className||e.textContent.trim().slice(0,10)));
     if(e.tagName==='IMG'&&e.complete&&!e.naturalWidth)o.push('brokenimg:'+(e.getAttribute('src')||'').slice(-40));
     if(e.children.length===0&&/TODO|undefined|NaN|\[object/.test(e.textContent))o.push('placeholder:'+e.textContent.trim().slice(0,30));});
     const t0=performance.now();let f=0;await new Promise(r=>{const step=()=>{f++;performance.now()-t0<1000?requestAnimationFrame(step):r();};requestAnimationFrame(step);});return {issues:[...new Set(o)].slice(0,30),fps:f};});
   report[key]={errors:errs,missing:[...new Set(miss)],...info};
  }catch(e){report[key]={fail:String(e).slice(0,300),errors:errs};try{await p.screenshot({path:`${out}/${key}_FAIL.png`});}catch{}}
  await ctx.close();console.log(key,JSON.stringify(report[key]).slice(0,240));}}
fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,1));await b.close();

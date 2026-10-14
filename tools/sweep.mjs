// 截图巡检：全部界面 × 两种横屏尺寸（1280×720 / 844×390）。游戏锁定横屏，竖屏 390×844 只检查旋转提示（rotate 场景）。战斗类切实时时钟并取多帧。
// 用法：node tools/sweep.mjs <输出目录> [场景名过滤]；输出 PNG + report.json（控制台报错、404、溢出元素、FPS）
import {chromium} from 'playwright';import path from 'node:path';import fs from 'node:fs';import {pathToFileURL,fileURLToPath} from 'node:url';
const out=process.argv[2]||'/tmp/sweep';const only=process.argv[3];fs.mkdirSync(out,{recursive:true});
const URL=pathToFileURL(path.resolve('src/index.html')).href+'?test=1';
const VPS=[['d',1280,720],['l',844,390],['r',1024,461],['w',2400,1080]].filter(v=>!process.env.SWEEP_VPS||process.env.SWEEP_VPS.split(',').includes(v[0]));const VP_P=['p',390,844];
const SAVE={coins:2400,unlock:5,done:[1,2,3,4],tutorialDone:true,character:'sayo'};
const W=(p,ms)=>p.waitForTimeout(ms);const T=(p,code,...a)=>p.evaluate(([c,a])=>window.__SAKURAYO_TEST__[c](...a),[code,a]);
const drawer=k=>async p=>{await T(p,'openDrawer',k);await W(p,900);};
const S={
  rotate:{vps:[VP_P],go:async p=>{await W(p,600);const r=await p.evaluate(()=>{const e=document.getElementById('syRotate');const c=e&&getComputedStyle(e);return {on:!!(e&&e.classList.contains('on')),display:c&&c.display,blocked:!!window.__syRotateBlocked,top:document.elementFromPoint(195,422)?.closest('#syRotate')?true:false};});if(!r.on||r.display==='none'||!r.blocked||!r.top)throw new Error('竖屏旋转提示未生效 '+JSON.stringify(r));}},
  lobby:async p=>{await W(p,600);},
  tutorial:async p=>{await p.evaluate(()=>{const b=document.getElementById('guideButton37')||document.getElementById('commandGuide48');b&&b.click();});await W(p,900);},
  lobbynew:async p=>{await p.evaluate(()=>{sessionStorage.setItem('syKeep','1');return localStorage.setItem('sakurayoV3',JSON.stringify({coins:0,unlock:1,done:[],tutorialDone:true,character:'sayo'}))});await p.reload();await p.locator('.bootArt35').waitFor({state:'detached',timeout:15000});await W(p,1200);await p.evaluate(()=>{const h=document.querySelector('.heroTap46,#heroTap46');h&&h.click();});await W(p,500);},
  stage:drawer('stage'),story:drawer('story'),talent:drawer('talent'),ach:drawer('ach'),shop:drawer('shop'),gacha:drawer('gacha'),roster:drawer('roster'),trials:drawer('trials'),archive:drawer('archive'),asc:drawer('asc'),
  wardrobe:async p=>{await T(p,'openWardrobe46');await W(p,900);},
  night:async p=>{await T(p,'openNight46');await W(p,900);},
  runmap:async p=>{await T(p,'runStart46',7);const clean=()=>p.evaluate(()=>{try{window.SakurayoDuel?.stop?.()}catch(e){}try{window.SakurayoShmup?.stop?.()}catch(e){}document.querySelectorAll('#duel46,#shm46').forEach(e=>e.remove());});
    for(let k=0;k<8;k++){const st=await T(p,'runState46');if((st.path||[]).length>=3&&!st.modal)break;if(st.modal){await T(p,'runChoose46',0).catch(()=>{});await T(p,'runSkipModal46').catch(()=>{});continue;}
      const a=st.available||[];const n=a.find(q=>!['sky','duel','boss'].includes(q.type))||a[0];if(!n)break;await T(p,'runEnter46',n.id);await W(p,300);await T(p,'runWinNode46').catch(()=>{});await T(p,'runContinue46').catch(()=>{});await clean();}
    await clean();await p.evaluate(()=>{document.querySelector('#run46')?.classList.remove('hidden');});await W(p,900);},
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
  duelcmd:{go:async p=>{await p.evaluate(()=>window.SakurayoDuel.start({character:'aya',seed:3,layer:1,auto:true,skill:0.85,route:'tech',power:1.2}));await W(p,1800);await p.locator('#duel46 .cmdT46').click();await W(p,400);}},
  settings:async p=>{await p.evaluate(()=>document.getElementById('settingsButton37')?.click());await W(p,900);},
  boss:{frames:2,go:async p=>{await T(p,'selectStage',2);await T(p,'start');await T(p,'dismissDialogue');await T(p,'realtime46');await W(p,1200);await T(p,'spawnBossNow');await W(p,1200);await T(p,'dismissDialogue').catch(()=>{});await W(p,1600);}},
  gachapv:{url:'nontest',go:async p=>{await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('sakurayoV3')||'{}');s.coins=999999;localStorage.setItem('sakurayoV3',JSON.stringify(s));sessionStorage.setItem('syKeep','1');});await p.reload();await p.locator('.bootArt35').waitFor({state:'detached',timeout:20000});
    await p.evaluate(()=>document.querySelector('[data-open="gacha"]')?.click());await W(p,1200);
    for(let k=0;k<12;k++){await p.evaluate(()=>document.getElementById('gachaPull10')?.click());await W(p,1500);if(await p.locator('.revealPv46').count())break;await p.evaluate(()=>{const o=document.getElementById('gachaReveal46');o&&o.remove();});await W(p,300);}
    await W(p,1500);}},
  duel:{frames:3,go:async p=>{await p.evaluate(()=>window.SakurayoDuel.start({character:'sayo',seed:5,layer:2,auto:true,skill:0.85,route:'bio',power:1.2}));await W(p,2500);}},
};
/* 横屏纵向滚动白名单：只有真正的长列表允许纵向滚动（理由写在值里），其余弹窗/面板出现纵向滚动即报「竖屏式堆叠」 */
const VSCROLL_WL={
 '#mailList46,#mailList46 *':'邮件列表：条数随运营增长，长列表',
 '.rosterGrid46,.rosterGrid46 *':'干员 / 仓库网格：条目随收集增长',
 '#storyDrawer .dbody,#storyDrawer .dbody *':'剧情档案：章节回放长列表',
 '.gachaHistory46,.gachaHistory46 *':'寻访记录：长列表',
 '#achDrawer .dbody':'成就：长列表',
};
const report={};const b=await chromium.launch({args:['--allow-file-access-from-files']});
for(const [name,sc] of Object.entries(S)){ if(only&&!only.split(',').includes(name))continue;
 for(const [v,w,h] of (sc.vps||VPS)){const key=`${name}_${v}`;const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:v!=='d',isMobile:v!=='d'});
  await ctx.addInitScript(w=>{window.__syVScrollWL=w;},VSCROLL_WL);await ctx.addInitScript({path:path.join(path.dirname(fileURLToPath(import.meta.url)),'ui_audit.js')});await ctx.addInitScript(s=>{if(!sessionStorage.getItem('syKeep'))localStorage.setItem('sakurayoV3',JSON.stringify(s));},SAVE);const p=await ctx.newPage();const errs=[],miss=[];
  p.on('pageerror',e=>errs.push(String(e).slice(0,200)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});p.on('requestfailed',r=>miss.push(r.url().split('/').slice(-3).join('/')));p.on('response',r=>{if(r.status()>=400)miss.push(r.status()+' '+r.url().split('/').slice(-3).join('/'));});
  try{await p.goto(sc.url==='nontest'?URL.replace('?test=1',''):URL);await p.locator('.bootArt35').waitFor({state:'detached',timeout:15000});const go=sc.go||sc;await go(p);
   const n=sc.frames||1;for(let i=0;i<n;i++){await p.screenshot({path:`${out}/${key}${n>1?'_'+i:''}.png`});if(i<n-1)await W(p,900);}
   const info=await p.evaluate(async()=>{const vw=innerWidth,vh=innerHeight,o=[];document.querySelectorAll('body *').forEach(e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return;const c=getComputedStyle(e);if(c.visibility==='hidden'||+c.opacity===0)return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
     if(e.children.length===0&&e.textContent.trim()&&(e.scrollWidth>e.clientWidth+2&&c.overflow!=='visible'&&c.textOverflow!=='ellipsis'))o.push('clip:'+(e.id||e.className)+':'+e.textContent.trim().slice(0,16));
     if((e.tagName==='BUTTON')&&(r.right>vw+2||r.bottom>vh+2||r.left<-2||r.top<-2))o.push('offscreen:'+(e.id||e.className||e.textContent.trim().slice(0,10)));
     if(r.width>40&&r.height>40&&/^(auto|scroll)$/.test(c.overflowY)&&e.scrollHeight>e.clientHeight+4&&e.closest('.drawer:not(.hidden),.modal:not(.hidden),[role=dialog]')){const id='#'+(e.id||e.closest('[id]')?.id||'?')+'.'+String(e.className||'').split(' ')[0];const wl=window.__syVScrollWL||{};if(!Object.keys(wl).some(k=>e.matches(k)))o.push('vscroll:'+id+':'+e.scrollHeight+'>'+e.clientHeight);}
     if(e.tagName==='IMG'&&e.complete&&!e.naturalWidth)o.push('brokenimg:'+(e.getAttribute('src')||'').slice(-40));
     if(e.children.length===0&&/TODO|undefined|NaN|\[object/.test(e.textContent))o.push('placeholder:'+e.textContent.trim().slice(0,30));});
     const t0=performance.now();let f=0;await new Promise(r=>{const step=()=>{f++;performance.now()-t0<1000?requestAnimationFrame(step):r();};requestAnimationFrame(step);});window.__syCanvasText=[];await new Promise(r=>setTimeout(r,700));const au=window.SyAudit?window.SyAudit.audit({touch:matchMedia('(pointer:coarse)').matches}):{fails:[],stats:{}};return {issues:[...new Set(o)].slice(0,30),fps:f,a11y:au.fails,a11yStats:au.stats};});
   report[key]={errors:errs,missing:[...new Set(miss)],...info};
  }catch(e){report[key]={fail:String(e).slice(0,300),errors:errs};try{await p.screenshot({path:`${out}/${key}_FAIL.png`});}catch{}}
  await ctx.close();console.log(key,JSON.stringify(report[key]).slice(0,240));}}
fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,1));await b.close();
const vs=Object.entries(report).flatMap(([k,v])=>(v.issues||[]).filter(x=>x.startsWith('vscroll:')).map(x=>k+' '+x));
console.log(`竖屏式堆叠检查（横屏弹窗/面板纵向滚动）：${vs.length} 项`);for(const x of vs)console.log('  '+x);
const bad=Object.entries(report).filter(([k,v])=>(v.a11y||[]).length);const total=bad.reduce((n,[k,v])=>n+v.a11y.length,0);
console.log(`a11y 图标/文字检查：${total} 项不达标（${bad.length} 个画面）`);for(const [k,v] of bad)console.log('  '+k+': '+v.a11y.slice(0,40).join(' | '));
if(process.env.SWEEP_STRICT&&(total||Object.values(report).some(v=>v.fail)))process.exit(1);

// 大厅底栏和小图标的截图（横屏 1280x720、932x430，竖屏 430x932）。用法：node tools/shoot_nav.mjs <输出目录>
import {chromium} from 'playwright';import path from 'node:path';import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const out=process.argv[2]||'/tmp/nav';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--allow-file-access-from-files']});
for(const [w,h] of [[1280,720],[932,430],[430,932]]){
  const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2});await c.addInitScript(()=>localStorage.setItem('sakurayoV3',JSON.stringify({coins:2400,unlock:5,done:[1,2,3,4],tutorialDone:true,character:'sayo'})));
  const p=await c.newPage();await p.goto(pathToFileURL(path.resolve('src/index.html')).href+'?test=1');await p.locator('.bootArt35').waitFor({state:'detached'});await p.waitForTimeout(1500);
  const nav=await p.locator('.homeNav46').boundingBox();await p.screenshot({path:`${out}/nav_${w}x${h}.png`,clip:{x:0,y:Math.max(0,nav.y-90),width:w,height:Math.min(h-Math.max(0,nav.y-90),nav.height+100)}});
  await p.screenshot({path:`${out}/top_${w}x${h}.png`,clip:{x:w/2,y:0,width:w/2,height:90}});
  if(w===1280)console.log(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('.homeNav46>button')].map(b=>{const i=b.querySelector('.terminalIcon48').getBoundingClientRect();return [b.querySelector('b').textContent,i.width|0,getComputedStyle(b.querySelector('.terminalIcon48')).color]}))));
  await c.close();}
await b.close();

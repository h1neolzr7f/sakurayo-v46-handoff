// 弹幕弹型截图：把 Boss 推进到指定符卡（lattice=激光、umbrella=鳞弹、eyeFinal=大玉+小刀），用法 node tools/shoot_shmup_cards.mjs <仓库根> <输出目录>
import {chromium} from 'playwright';import path from 'node:path';import {pathToFileURL} from 'node:url';
const root=process.argv[2], out=process.argv[3];
const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await (await b.newContext({viewport:{width:1280,height:720}})).newPage();
await p.goto(pathToFileURL(path.resolve(root,'src/index.html')).href+'?test=1');await p.locator('.bootArt35').waitFor({state:'detached'});
for(const [layer,want] of [[3,'lattice'],[2,'umbrella'],[1,'eyeFinal']]){
 await p.evaluate(([layer])=>{window.__shmManual=1;window.SakurayoShmup.start({character:'aya',seed:4,layer,kind:'boss',auto:true,skill:0.9,power:2});},[layer]);
 const ok=await p.evaluate(([want])=>{const g=window.SakurayoShmup.current();g.P.lives=99;for(let i=0;i<60*240;i++){window.SakurayoShmup.step(1/60);g.P.lives=Math.max(g.P.lives,5);g.P.inv=0;if(g.boss&&g.boss.card&&g.boss.card.p===want&&g.boss.cardT>3)return true;if(g.done)return false;}return false;},[want]);
 await p.evaluate(()=>{const g=window.SakurayoShmup.current();g.auto=false;for(let i=0;i<20;i++)window.SakurayoShmup.step(1/60);});
 await p.screenshot({path:`${out}/shmcard_${want}.png`});console.log(want,ok);
}
await b.close();

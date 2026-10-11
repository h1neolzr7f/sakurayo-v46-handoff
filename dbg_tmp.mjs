import {chromium} from 'playwright';import path from 'node:path';import {pathToFileURL} from 'node:url';
const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await (await b.newContext({viewport:{width:1024,height:461}})).newPage();
await p.goto(pathToFileURL(path.resolve('src/index.html')).href+'?test=1');await p.locator('.bootArt35').waitFor({state:'detached'});
await p.evaluate(()=>window.__SAKURAYO_TEST__.openDrawer('gacha'));await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>[...document.querySelectorAll('#gachaDrawer .wishStage46 > *, #gachaDrawer .dhead')].map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return e.className+' z'+c.zIndex+' '+[r.x,r.y,r.width,r.height].map(Math.round)})));
await b.close();

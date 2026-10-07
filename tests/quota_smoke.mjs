import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=path.resolve(root,process.env.SAKURAYO_ENTRY||process.argv[2]||'src/index.html');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:932,height:430}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{
  const set=Storage.prototype.setItem;
  set.call(localStorage,'sakurayoV3',JSON.stringify({coins:12345,unlock:4,done:[1,2,3,4],tal:{atk:2},mainGod:{points:42},tutorialDone:true}));
  window.__failSave=true;
  Storage.prototype.setItem=function(key,value){if(window.__failSave)throw new DOMException('fixture quota full','QuotaExceededError');return set.call(this,key,value);};
 });
 await page.goto(pathToFileURL(entry).href+'?test=1');await page.waitForFunction(()=>window.__SAKURAYO_TEST__);await page.locator('.bootArt35').waitFor({state:'detached'});
 const api=(name,...args)=>page.evaluate(({name,args})=>window.__SAKURAYO_TEST__[name](...args),{name,args});
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sakurayoV3')));
 const initial=await api('saveSnapshot');assert.equal(initial.coins,12345);assert.equal(initial.unlock,4);assert.deepEqual(initial.done,[1,2,3,4]);
 await page.locator('#commandSettings47').click();await page.locator('#commandSave48').click();const incoming={tal:{},mainGod:{},coins:456,unlock:1};await page.locator('#saveText38').fill(JSON.stringify(incoming));await page.locator('#importSave38').click();
 assert.deepEqual(await api('saveSnapshot'),initial,'failed import leaves runtime identity content intact');assert.equal((await stored()).coins,12345,'failed import leaves old disk contents intact');assert.equal(await page.locator('#saveDrawer38').isVisible(),true);assert.match(await page.locator('#storageStatus38').textContent(),/未能写入/);
 assert.match(await page.locator('#devErrorText').textContent(),/storage/);await page.locator('#devErrorClose').click();
 await page.locator('#saveDrawer38 .close').click();await api('grantCheat46');assert.equal((await api('saveSnapshot')).coins,22344);assert.equal((await stored()).coins,12345);assert.equal(await page.locator('#storageStatus38').isVisible(),true,'success toast cannot replace persistent save-failure warning');
 await page.locator('#devErrorClose').click();await page.locator('#commandSettings47').click();await page.locator('#commandSave48').click();await page.locator('#saveText38').fill(JSON.stringify(incoming));await page.evaluate(()=>window.__failSave=false);await page.locator('#importSave38').click();assert.equal((await api('saveSnapshot')).coins,456);assert.equal((await stored()).coins,456);assert.equal(await page.locator('#storageStatus38').count(),0);assert.equal(await page.locator('#saveDrawer38').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS quota browser: readable old save, failed write/import, persistent warning and successful retry; '+entry);
}finally{await browser.close();}

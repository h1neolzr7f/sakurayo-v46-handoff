import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=process.env.SAKURAYO_ENTRY||process.argv[2]||'src/index.html';
const url=(/^https?:/.test(entry)?entry:pathToFileURL(path.resolve(root,entry)).href)+'?test=1';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:932,height:430}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(url);await page.locator('.bootArt35').waitFor({state:'detached'});
 const api=(method,...args)=>page.evaluate(({method,args})=>window.__SAKURAYO_TEST__[method](...args),{method,args});
 await api('openDrawer','gacha');await api('grantCheat46');await api('pullGacha46',1);
 assert.equal(await page.evaluate(()=>window.SakurayoUI.active()?.id),'gachaReveal46','reveal owns nested UI');
 for(let i=0;i<8;i++) {await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.closest('#gachaReveal46')!==null),true);}
 await page.keyboard.press('Escape');assert.equal(await page.locator('#gachaReveal46').count(),0);assert.equal(await page.evaluate(()=>window.SakurayoUI.active()?.id),'gachaDrawer');
 await page.keyboard.press('Escape');await api('selectSkin','techcoat');await api('liveTrigger46','blink');
 await page.waitForTimeout(110);assert.equal(await page.locator('.heroLiveBase46').evaluate(n=>n.style.opacity),'1');
 const before=await api('liveSnapshot46');await api('openDrawer','gacha');await page.waitForTimeout(120);const stopped=await api('liveSnapshot46');await page.waitForTimeout(120);assert.equal((await api('liveSnapshot46')).t,stopped.t);
 await page.keyboard.press('Escape');await page.waitForTimeout(100);assert.ok((await api('liveSnapshot46')).t>stopped.t);assert.ok(stopped.t>=before.t);
 await api('start');if(await page.locator('#tutorialDrawer37').isVisible())await page.locator('#tutorialSkip37').click();
 assert.equal(await page.locator('#dialogueContinue48').evaluate(n=>n.tagName),'BUTTON');assert.equal(await page.evaluate(()=>document.activeElement.id),'dialogueContinue48');
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'dialogueContinue48');
 const line=await page.locator('#dialogueText').textContent();await page.keyboard.press('Enter');assert.notEqual(await page.locator('#dialogueText').textContent(),line);
 while(await page.locator('#dialogue').isVisible())await page.keyboard.press('Escape');
 await page.keyboard.down('d');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const p0=await api('snapshot');await page.evaluate(()=>window.advanceTime(100));const p1=await api('snapshot');assert.equal(p1.player.x,p0.player.x);await page.keyboard.up('d');
 await api('backMenu');await api('openExploration41',1);
 await page.keyboard.down('a');await page.locator('#exploreClose41').click();await page.keyboard.up('a');await api('openExploration41',1);const e0=(await api('snapshot')).extensions.exploration;await page.waitForTimeout(100);const e1=(await api('snapshot')).extensions.exploration;assert.equal(e1.x,e0.x);
 await api('collectExplorationNode41','seal-fragment');assert.equal((await api('triggerExplorationEvent41','echo-altar')).opened,true);
 const firstChoice=page.locator('#exploreEventChoices412 button').first();await firstChoice.focus();await page.keyboard.press('Tab');assert.equal(await firstChoice.evaluate(n=>n===document.activeElement),false,'event choices retain native Tab');await page.keyboard.press('Shift+Tab');await page.keyboard.press('Enter');assert.equal(await page.locator('#exploreEvent412').isVisible(),false);assert.equal((await api('snapshot')).extensions.exploration.eventsCompleted.includes('echo-altar'),true);
 assert.deepEqual(errors,[]);console.log('PASS UI input smoke: nested reveal, costume blink, hidden RAF, dialogue keyboard, blur/exploration release');
} finally {await browser.close();}

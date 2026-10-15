import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=process.env.SAKURAYO_ENTRY||process.argv[2]||'src/index.html';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:932,height:430}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto((/^https?:/.test(entry)?entry:pathToFileURL(path.resolve(root,entry)).href)+'?test=1');await page.locator('.bootArt35').waitFor({state:'detached'});
 await page.evaluate(()=>document.getElementById('moreButton39').click());
 assert.equal(await page.evaluate(()=>window.SakurayoUI.active()?.id),'moreDrawer39','more is a registered UI drawer');
 for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement.closest('#moreDrawer39')));}
 await page.keyboard.press('Escape');assert.equal(await page.locator('#moreDrawer39').isVisible(),false);
 const routes=[['commandSettings47',null,'settingsDrawer37'],['commandSettings47','commandGuide48','tutorialDrawer37'],['commandSettings47','commandStats48','analyticsDrawer37'],['commandSettings47','commandSave48','saveDrawer38'],['commandSettings47','commandModkit48','modKitDrawer42']];
 for(const [first,next,id] of routes){await page.locator('#'+first).click();if(next)await page.locator('#'+next).click();assert.equal(await page.evaluate(()=>window.SakurayoUI.active()?.id),id);await page.keyboard.press('Tab');assert.equal(await page.evaluate(id=>document.getElementById(id).contains(document.activeElement),id),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#'+id).isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'commandSettings47');}
 await page.evaluate(()=>window.__SAKURAYO_TEST__.start());assert.equal(await page.locator('#tutorialDrawer37').isVisible(),true);await page.keyboard.press('Escape');assert.equal((await page.evaluate(()=>window.__SAKURAYO_TEST__.snapshot())).mode,'menu');
 await page.locator('#commandSettings47').click();await page.locator('#commandGuide48').click();await page.locator('#tutorialSkip37').click();assert.equal((await page.evaluate(()=>window.__SAKURAYO_TEST__.snapshot())).mode,'menu','closing launch tutorial cancels pending start');
 assert.deepEqual(errors,[]);console.log('PASS legacy UI smoke: registered more/settings/tutorial/save/analytics/modkit, focus restore and tutorial close effects');
}finally{await browser.close();}

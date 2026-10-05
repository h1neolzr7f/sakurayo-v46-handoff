import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=process.env.SAKURAYO_ENTRY||path.join(root,'src/index.html');
const browser=await chromium.launch({headless:true});
const failures=[];
const errors=[],external=[];
const context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true});
const page=await context.newPage();
await page.addInitScript(()=>localStorage.clear());
page.on('pageerror',e=>errors.push(String(e)));
page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
const open=name=>page.evaluate(name=>window.__SAKURAYO_TEST__.openDrawer(name),name);
async function check(name,fn){
  await page.goto(pathToFileURL(entry).href+'?test=1');
  await page.waitForFunction(()=>window.__SAKURAYO_TEST__&&window.SakurayoLobby);
  await page.locator('.bootArt35').waitFor({state:'detached',timeout:8000});
  try{await fn();console.log('PASS '+name);}catch(e){failures.push(name+': '+e.message);console.error('FAIL '+name+': '+e.message);}
}
const fits=(box,width,height)=>box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1;
try{
  await check('lobby refresh preserves stylesheet identity, order and procurement colors',async()=>{
    await open('shop');
    const before=await page.locator('#shopDrawer .shopTabs40 button.on').evaluate(b=>getComputedStyle(b).backgroundImage);
    await page.evaluate(()=>{window.roomStyleBefore=document.getElementById('sakurayo-lobby-css');window.roomStyleNext=window.roomStyleBefore.nextSibling;window.roomStyleMutations=[];window.roomStyleObserver=new MutationObserver(records=>window.roomStyleMutations.push(...records));window.roomStyleObserver.observe(document.head,{childList:true,subtree:true,characterData:true});});
    for(let i=0;i<3;i++){await open('gacha');await open('roster');await open('shop');}
    assert.equal(await page.evaluate(()=>window.roomStyleBefore===document.getElementById('sakurayo-lobby-css')),true,'refresh reuses the existing stylesheet node');
    assert.equal(await page.evaluate(()=>window.roomStyleBefore.nextSibling===window.roomStyleNext),true,'refresh preserves stylesheet order');
    assert.equal(await page.locator('#shopDrawer .shopTabs40 button.on').evaluate(b=>getComputedStyle(b).backgroundImage),before,'procurement active color survives visiting other rooms');
    assert.equal(await page.evaluate(()=>{window.roomStyleObserver.disconnect();return window.roomStyleMutations.filter(r=>r.target===window.roomStyleBefore||[...r.addedNodes,...r.removedNodes].some(n=>n.id==='sakurayo-lobby-css')).length;}),0,'refresh does not rewrite unchanged CSS');
  });
  await check('warehouse scroll reaches and opens the final card in long tabs',async()=>{
    for(const [width,height] of [[932,430],[640,360],[430,932]]){
      await page.setViewportSize({width,height});await open('roster');
      for(const tab of ['school','job','fusion','fashion','weapon','chronicle']){
        await page.locator('[data-roster="'+tab+'"]').click();
        const body=page.locator('#rosterBody46');
        await body.evaluate(b=>b.scrollTop=0);
        const needsScroll=await body.evaluate(b=>b.scrollHeight>b.clientHeight);
        await page.mouse.move(width*.55,height*.7);await page.mouse.wheel(0,4000);
        if(needsScroll)await page.waitForFunction(()=>document.getElementById('rosterBody46').scrollTop>0,{},{timeout:3000});
        const last=page.locator(tab==='chronicle'?'.chronicleCard46':'.rosterSlot46').last();
        const box=await last.boundingBox();
        assert.ok(fits(box,width,height),tab+' final entry is reachable at '+width+'x'+height);
        if(tab!=='chronicle'){
          await last.click();assert.equal(await page.locator('#rosterPeek46').isVisible(),true);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#rosterPeek46').count(),0,'Escape closes the final card detail');
        }
      }
    }
  });
  await check('card detail fits short screens and contains keyboard focus',async()=>{
    await page.setViewportSize({width:640,height:360});await open('roster');
    await page.locator('[data-roster="scrap"]').click();
    const card=page.locator('.rosterSlot46').first();await card.click();
    const panel=page.locator('.rosterPeekCard46');
    assert.ok(fits(await panel.boundingBox(),640,360),'detail panel stays inside the viewport');
    assert.equal(await page.locator('#rosterPeek46').getAttribute('role'),'dialog');assert.equal(await page.locator('#rosterPeek46').getAttribute('aria-modal'),'true');
    const close=page.locator('#rosterPeekClose46'),box=await close.boundingBox();
    assert.ok(box&&box.width>=40&&box.height>=40,'detail provides a 40px close target');
    await panel.locator('p').click();assert.equal(await page.locator('#rosterPeek46').count(),1,'reading detail text keeps it open');
    for(const key of ['Tab','Shift+Tab','Tab']){await page.keyboard.press(key);assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#rosterPeek46')),true,'keyboard focus stays in detail');}
    await page.keyboard.press('Escape');assert.equal(await page.locator('#rosterPeek46').count(),0);
    assert.equal(await card.evaluate(b=>document.activeElement===b),true,'Escape returns focus to the source card');
    for(let i=0;i<3;i++){await card.click();await close.click();assert.equal(await card.evaluate(b=>document.activeElement===b),true,'explicit close returns focus after repeated opens');}
    await card.click();await page.locator('#rosterPeek46').click({position:{x:2,y:2}});
    assert.equal(await page.locator('#rosterPeek46').count(),0,'outside click closes detail');
  });
  await check('short-screen gacha title, pity and actions do not overlap',async()=>{
    for(const [width,height] of [[640,360],[740,360],[932,430]]){
      await page.setViewportSize({width,height});await open('gacha');
      for(const pool of ['remnant','fashion','weapon']){
        await page.locator('[data-pool="'+pool+'"]').click();
        const title=await page.locator('.wishTitle46').boundingBox(),pity=await page.locator('.wishPity46').boundingBox(),dock=await page.locator('.wishDock46').boundingBox();
        assert.ok(fits(title,width,height)&&fits(pity,width,height)&&fits(dock,width,height),pool+' labels and controls fit '+width+'x'+height);
        assert.ok(title.y+title.height<=pity.y,'title stays above pity at '+width+'x'+height);
        assert.ok(pity.y+pity.height<=dock.y,'pity stays above actions at '+width+'x'+height);
        for(const id of ['gachaPull1','gachaPull10'])assert.equal(await page.locator('#'+id).evaluate(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===b||b.contains(hit);}),true,id+' remains tappable');
      }
    }
  });
  assert.deepEqual(errors,[],'room interactions do not raise page errors');
  assert.deepEqual(external,[],'rooms run offline');
  assert.deepEqual(failures,[],'polished room regressions');
}finally{await browser.close();}

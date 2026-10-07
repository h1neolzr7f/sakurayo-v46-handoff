import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Shared by browser_smoke and the focused source/offline receipt regression.
export async function verifyContentReceipts(browser,url){
  const context=await browser.newContext({viewport:{width:932,height:430},isMobile:true,hasTouch:true});
  const errors=[];
  try{
    await context.addInitScript(()=>{
      if(!localStorage.getItem('sakurayoV3'))localStorage.setItem('sakurayoV3',JSON.stringify({coins:500,tutorialDone:true,extensions:{
        'official.framework-example':{__version:1,data:{purchases:[]}},
        'official.story-exploration':{__version:1,data:{collected:[],visits:[],choices:[],fragments:{bad:true}}}
      }}));
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
    const api=(method,...args)=>page.evaluate(({method,args})=>window.__SAKURAYO_TEST__[method](...args),{method,args});
    const readStored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sakurayoV3')));
    const ready=async()=>{await page.locator('.bootArt35').waitFor({state:'detached',timeout:8000});assert.equal(await page.locator('#menu').isVisible(),true);};
    await page.goto(url,{waitUntil:'domcontentloaded'});await ready();
    let save=await api('saveSnapshot');assert.equal(save.coins,500);
    assert.deepEqual(save.extensions['official.framework-example'].data.purchases,{});
    for(const key of ['collected','visits','choices'])assert.deepEqual(save.extensions['official.story-exploration'].data[key],{});
    assert.deepEqual(save.extensions['official.story-exploration'].data.fragments,[]);
    await api('openExploration41',1);await api('collectExplorationNode41','torii-cache');assert.equal((await api('saveSnapshot')).coins,512);
    await api('collectExplorationNode41','seal-fragment');
    assert.equal((await api('triggerExplorationEvent41','echo-altar')).opened,true);
    await page.locator('#exploreEventChoices412 button').filter({hasText:'保留残响'}).click();
    save=await readStored();assert.equal(save.coins,530);assert.equal(save.extensions['official.story-exploration'].data.choices['shrine-outskirts:echo-altar'],'preserve');
    assert.deepEqual(save.extensions['official.story-exploration'].data.fragments,['神社封印残页','被保留的神社残响']);
    await api('closeExploration41');await api('openDrawer','shop');
    await page.locator('.shopTabs40 [data-shop="extensions"]').click();
    const button=page.locator('[data-shop-group="extensions"] .shopItem40').filter({hasText:'扩展观测手册'}).locator('button');
    await button.evaluate(b=>window.__receiptOldShopCallback=b.onclick);
    await button.click();await page.evaluate(()=>window.__receiptOldShopCallback());
    save=await readStored();assert.equal(save.coins,505);assert.equal(save.extensions['official.framework-example'].data.purchases.observer_manual,1);
    assert.equal(await api('buyExtensionItem41','official.framework-example','observer_manual'),false);
    await page.reload({waitUntil:'domcontentloaded'});await ready();
    save=await api('saveSnapshot');assert.equal(save.coins,505);
    const data=save.extensions['official.story-exploration'].data;
    assert.equal(data.collected['shrine-outskirts:torii-cache'],true);assert.equal(data.collected['shrine-outskirts:seal-fragment'],true);assert.equal(data.visits['shrine-outskirts'],1);assert.equal(data.choices['shrine-outskirts:echo-altar'],'preserve');
    await api('openExploration41',1);await api('collectExplorationNode41','torii-cache');await api('collectExplorationNode41','seal-fragment');
    assert.equal((await api('triggerExplorationEvent41','echo-altar')).opened,false);assert.equal((await api('saveSnapshot')).coins,505);
    await api('closeExploration41');await api('openDrawer','shop');await page.locator('.shopTabs40 [data-shop="extensions"]').click();
    const reloaded=page.locator('[data-shop-group="extensions"] .shopItem40').filter({hasText:'扩展观测手册'}).locator('button');assert.equal(await reloaded.isDisabled(),true);
    await reloaded.evaluate(b=>b.onclick());assert.equal(await api('buyExtensionItem41','official.framework-example','observer_manual'),false);
    save=await readStored();assert.equal(save.coins,505);assert.equal(save.extensions['official.framework-example'].data.purchases.observer_manual,1);assert.equal(save.extensions['official.story-exploration'].data.visits['shrine-outskirts'],2);
    assert.deepEqual(errors,[]);
    return {coins:save.coins,purchases:save.extensions['official.framework-example'].data.purchases,exploration:save.extensions['official.story-exploration'].data,pageErrors:errors};
  }finally{await context.close();}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const entry=process.env.SAKURAYO_ENTRY||process.argv[2]||'src/index.html';
  const source=/^https?:\/\//i.test(entry)?entry:pathToFileURL(path.resolve(root,entry)).href;
  const {chromium}=await import('playwright'),browser=await chromium.launch({headless:true});
  try{
    const result=await verifyContentReceipts(browser,source+'?test=1&debug=1');
    fs.mkdirSync(path.join(root,'tests/artifacts/content'),{recursive:true});
    fs.writeFileSync(path.join(root,'tests/artifacts/content/receipts.json'),JSON.stringify({source,...result,completedAt:new Date().toISOString()},null,2));
    console.log('PASS content receipts: malformed arrays, real shop/event buttons, stale callback, serialized reload and repeat rejection');
  }finally{await browser.close();}
}

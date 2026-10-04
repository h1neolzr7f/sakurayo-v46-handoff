import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry=process.env.SAKURAYO_ENTRY || path.join(root,'src/index.html');
const output=path.join(root,'tests/artifacts/command');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true});
  const page=await context.newPage(), errors=[],external=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  await page.goto(pathToFileURL(entry).href+'?test=1');
  await page.waitForFunction(()=>window.SakurayoCommand&&window.__SAKURAYO_TEST__);
  const api=(name,...args)=>page.evaluate(({name,args})=>window.__SAKURAYO_TEST__[name](...args),{name,args});
  const close=()=>page.locator('#commandDrawer47 .close').click();
  for(const [width,height] of [[932,430],[844,390],[740,360],[430,932]]){
    await page.setViewportSize({width,height});
    for(const id of ['commandCharacter47','commandSupplies47','commandPrepare47','commandHistory47']){
      const button=page.locator('#'+id),box=await button.boundingBox();
      assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,id+' visible in '+width+'x'+height);
      assert.ok(box.height>=40,id+' touch target >=40');
      await button.click({timeout:5000});
      assert.equal(await page.locator('#commandDrawer47').isVisible(),true);
      await close();
    }
    await page.screenshot({path:path.join(output,`lobby-${width}x${height}.png`)});
  }
  await page.setViewportSize({width:932,height:430});
  await page.locator('#commandCharacter47').click();
  for(const id of ['aya','rion','sayo']){
    await page.locator(`#commandBody47 [data-character="${id}"]`).click();
    assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('#commandDrawer47')),true,'refresh keeps keyboard focus inside dialog');
    await page.locator('#commandSelect47').click();
    assert.equal(await page.locator('#commandSelect47').textContent(),'当前出击角色');
  }
  await close();
  await page.locator('#commandHistory47').click();
  assert.match(await page.locator('#commandBody47').textContent(),/暂无战绩/);
  await close();
  await api('unlockMainGod');
  await page.locator('#commandSupplies47').click();
  const claim=page.locator('[data-supply="chapter4"]');
  const beforeCoins=await page.evaluate(()=>JSON.parse(localStorage.getItem('sakurayoV3')).coins);
  await claim.click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sakurayoV3')).coins),beforeCoins+480);
  assert.equal(await claim.isDisabled(),true);
  assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('#commandDrawer47')),true);
  await page.screenshot({path:path.join(output,'supplies.png')});
  await close();
  await page.reload();
  await page.locator('#commandSupplies47').click();
  assert.equal(await page.locator('[data-supply="chapter4"]').textContent(),'已领取');
  await close();
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('sakurayoV3'));s.shop40.ops.fashion={owned:{fashion_sayo_crown:1},equipped:'fashion_sayo_crown'};s.shop40.ops.weapon={owned:{weapon_sayo_final:1},equipped:'weapon_sayo_final'};localStorage.setItem('sakurayoV3',JSON.stringify(s));});
  await page.reload();
  await page.locator('#commandPrepare47').click();
  assert.match(await page.locator('#commandBody47').textContent(),/终夜樱冠/);
  assert.match(await page.locator('#commandBody47').textContent(),/夜樱终弹/);
  await page.waitForTimeout(350);
  await page.screenshot({path:path.join(output,'prepare.png')});
  await page.locator('#commandLaunch47').click();
  if(await page.locator('#tutorialDrawer37').isVisible())for(let i=0;i<4;i++)await page.locator('#tutorialNext37').click();
  await api('dismissDialogue');
  assert.equal((await page.evaluate(()=>JSON.parse(window.render_game_to_text()))).mode,'play');
  await api('backMenu');
  for(const mode of ['testimony','mainGod']){
    if(mode==='mainGod')await api('selectMainGodTier',1);
    await api('setRunMode46',mode);await api('start');await api('dismissDialogue');await api('killPlayer');
    const r=await page.evaluate(()=>JSON.parse(localStorage.getItem('sakurayoV3')).runHistory[0]);
    assert.equal(r.mode,mode);assert.equal(r.character,'sayo');assert.ok(Number.isFinite(r.duration));
    await api('backMenu');
  }
  await page.locator('#commandHistory47').click();
  assert.match(await page.locator('#commandBody47').textContent(),/证词模式/);
  assert.match(await page.locator('#commandBody47').textContent(),/高难轮回/);await close();
  const assets=['ui/lobby-command-v2.webp','ui/command-seal-loop.webp','ui/command-seal-still.webp'];
  for(let n=1;n<=4;n++)assets.push(`stages/stage_${n}/battle_floor_v2.webp`,`stages/stage_${n}/battle_bg_v2.webp`,`stages/stage_${n}/chapter_keyart_v2.webp`);
  for(const asset of assets)assert.equal(await page.evaluate(p=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>0);i.onerror=()=>resolve(false);i.src=window.artUrl(p);}),asset),true,'offline image decodes: '+asset);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.match(await page.locator('#commandHeading47 img').evaluate(i=>i.currentSrc),/command-seal-still/);
  for(const name of ['gacha','roster','shop','stage','archive']){
    assert.equal((await api('openDrawer',name)).visible,true);
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(external,[],'game runs offline');
  console.log('PASS command smoke: touch layouts, focus, three roles, supplies/reload, preparation launch, five rooms, offline');
} finally {await browser.close();}

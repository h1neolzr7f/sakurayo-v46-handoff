import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=process.env.SAKURAYO_ENTRY||path.join(root,'src/index.html');
const out=path.join(root,'tests/artifacts/tactical');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true});
 const page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
 await page.goto(pathToFileURL(entry).href+'?test=1');
 await page.locator('.bootArt35').waitFor({state:'detached',timeout:8000});
 assert.equal(await page.locator('#commandMail48').count(),1,'tactical mailbox entry must exist');
 await page.locator('#commandSettings47').click();
 assert.equal(await page.locator('#commandSave48').isVisible(),true,'settings exposes real save manager');
 await page.locator('#commandSave48').click();
 assert.equal(await page.locator('#saveDrawer38').isVisible(),true,'save manager opens through lobby settings');
 await page.locator('#saveDrawer38 .close').click();
 const newPanels=['commandMail48','commandNotice48','commandActivity48','commandSupplies47','commandLogin48','commandPrepare47','commandHistory47','commandCharacter47'];
 const close=async()=>page.locator('#commandDrawer47 .close').click();
 await page.locator('#commandNotice48').click();
 await page.locator('#commandNoticeActivity48').click();
 assert.equal(await page.locator('#commandTitle47').textContent(),'活动与行动','notice link switches to real activity panel');
 await close();
 assert.equal(await page.evaluate(()=>document.activeElement.id),'commandNotice48','closing a switched panel restores the original lobby launcher focus');
 for(const [width,height] of [[1280,720],[932,430],[844,390],[740,360],[640,360],[430,932]]){
  await page.setViewportSize({width,height});
  assert.equal(await page.locator('#menu .coins #coins').count(),1,'wallet keeps the live coin counter used by menu updates');
  const title=await page.locator('#coverTitle36').boundingBox();
  assert.ok(title,'lobby title exists');
  assert.equal(await page.locator('#characterList .charCard').count(),3,'three character portraits');
  for(const card of await page.locator('#characterList .charCard').all()){
   const box=await card.boundingBox(),id=await card.getAttribute('data-character');
   assert.ok(box&&box.y>=height*.5,'character portrait '+id+' belongs below mid-screen in '+width+'x'+height);
   assert.ok(box.width>=40&&box.height>=40,'character portrait '+id+' has touch area');
   assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'character portrait '+id+' fits '+width+'x'+height);
   assert.ok(box.x+box.width<=title.x||title.x+title.width<=box.x||box.y+box.height<=title.y||title.y+title.height<=box.y,'character portrait '+id+' never overlaps lobby title');
   assert.equal(await card.evaluate(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===b||b.contains(hit);}),true,'character portrait '+id+' is not covered');
  }
  const resource=await page.locator('#menu .top .coins').boundingBox();
  const mail=await page.locator('#commandMail48').boundingBox();
  assert.ok(resource&&resource.x>=width*.45,'resource bar belongs on right half in '+width+'x'+height);
  assert.ok(mail&&mail.x>=width*.45,'mail belongs on right half in '+width+'x'+height);
  const stage=await page.locator('#menu .stageMini').boundingBox();
  const nav=await page.locator('#menu .homeNav46').boundingBox();
  assert.ok(stage&&nav&&nav.y>=stage.y+stage.height-1,'bottom navigation stays below stage capsule in '+width+'x'+height);
  const buttons=[...newPanels,'commandSettings47','start'];
  for(const id of buttons){
   const box=await page.locator('#'+id).boundingBox();
   assert.ok(box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,id+' fits '+width+'x'+height);
   assert.ok(box.width>=40&&box.height>=40,id+' has touch area');
   assert.equal(await page.locator('#'+id).evaluate(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===b||b.contains(hit);}),true,id+' is not covered');
  }
  assert.equal(await page.locator('#menu .homeNav46 button').count(),7,'seven primary feature tiles (incl. trials)');
  assert.equal(await page.locator('.tacticalDeck48 > button').count(),3,'three floating right controls');
  for(const button of await page.locator('#menu .homeNav46 button').all()){
   const box=await button.boundingBox(),name=(await button.textContent()).trim();
   assert.ok(box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'bottom navigation '+name+' fits '+width+'x'+height);
   assert.ok(box.width>=40&&box.height>=40,'bottom navigation '+name+' has touch area');
   assert.equal(await button.evaluate(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===b||b.contains(hit);}),true,'bottom navigation '+name+' is not covered');
  }
  for(const id of newPanels){await page.locator('#'+id).click();assert.equal(await page.locator('#commandDrawer47').isVisible(),true);await close();}
  for(const name of ['gacha','roster','shop','stage','archive']){
   await page.locator('#menu .homeNav46 [data-open="'+name+'"]').click();
   assert.equal(await page.locator('.drawer:not(.hidden)').count()>0,true,'tile opens '+name);
   await page.locator('.drawer:not(.hidden) .close').first().click();
  }
  await page.screenshot({path:path.join(out,'lobby-'+width+'x'+height+'.png')});
 }
 await page.setViewportSize({width:1280,height:720});
 for(const mode of ['story','testimony','mainGod']){
  await page.locator('#commandActivity48').click();
  assert.equal(await page.locator('#commandTitle47').textContent(),'活动与行动');
  assert.equal(await page.locator('#commandBody47 [data-operation]').count(),3,'activity panel exposes three real operations');
  await page.locator('#commandBody47 [data-operation="'+mode+'"]').click();
  assert.equal(await page.locator('#commandDrawer47').isVisible(),false,'activity link closes command panel');
  assert.equal(await page.locator('#stageDrawer').isVisible(),true,'activity link opens stages');
  assert.equal(await page.locator('#modeBar46 [data-mode="'+mode+'"]').evaluate(button=>button.classList.contains('on')),true,'activity link selects '+mode);
  await page.locator('#stageDrawer .close').click();
  assert.match(await page.locator('#commandActivityName48').textContent(),new RegExp({story:'回收演习',testimony:'证词模式',mainGod:'主神空间'}[mode]),'activity selection immediately updates the lobby brief');
 }
 const coins=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sakurayoV3')||'{}').coins||0);
 const before=await coins();
 await page.locator('#commandMail48').click();
 await page.locator('[data-mail="welcome"]').click();
 await page.screenshot({path:path.join(out,'mailbox.png')});
 await page.locator('#commandMailClaim48').click();
 assert.equal(await coins(),before+200);
 assert.equal(await page.locator('#commandMailClaim48').isDisabled(),true);
 await close();
 await page.locator('#commandLogin48').click();
 await page.locator('#commandLoginClaim48').click();
 assert.equal(await coins(),before+260);
 assert.equal(await page.locator('#commandLoginClaim48').isDisabled(),true);
 await page.screenshot({path:path.join(out,'login.png')});await close();
 await page.reload();await page.locator('.bootArt35').waitFor({state:'detached',timeout:8000});
 await page.locator('#commandMail48').click();
 assert.equal(await page.locator('#commandMailClaim48').isDisabled(),true,'mail receipt survives reload');await close();
 await page.locator('#commandLogin48').click();assert.equal(await page.locator('#commandLoginClaim48').isDisabled(),true,'login receipt survives reload');await close();
 assert.equal(await coins(),before+260,'reload never grants extra coins');
 await page.locator('#commandSettings47').click();await page.locator('#commandSave48').click();
 const exported=JSON.parse(await page.locator('#saveText38').inputValue());
 assert.equal(exported.shop40.ops.services.welcomeClaimed,true,'export includes mailbox receipt');
 assert.equal(exported.shop40.ops.services.loginDates.length,1,'export includes login receipt');
 assert.equal(exported.coins,before+260,'export includes current balance');
 await page.locator('#saveDrawer38 .close').click();
 await page.locator('#commandNotice48').click();
 assert.match(await page.locator('#commandBody47').textContent(),/4\.6\.0/);await close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS tactical smoke: six live tiles, three floating controls, mailbox/notice/activity/tasks/login, three mode links, six viewports, claim/reload, touch hits, offline');
}finally{await browser.close();}

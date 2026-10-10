import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const entry=process.env.SAKURAYO_ENTRY||path.join(root,'src/index.html');
const browser=await chromium.launch({headless:true});
const errors=[];
try{
  for(const [w,h] of [[844,390],[932,430],[640,360]]){
    const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:true});
    const page=await context.newPage();
    await page.addInitScript(()=>localStorage.clear());
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(pathToFileURL(entry).href);
    await page.locator('.bootArt35').waitFor({state:'detached'});
    await page.waitForFunction(()=>document.querySelector('#heroLive46')?.classList.contains('lobbyArt46'));
    const m=await page.evaluate(()=>{const r=document.querySelector('#heroLive46').getBoundingClientRect();const head=document.querySelector('#heroLive46 .heroHead46').getBoundingClientRect();
      const cx=head.x+head.width/2,cy=head.y+head.height/2;const ui=[...document.querySelectorAll('#menu .menu button, #menu .menu section, #menu>.heroLiveName46')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.left<cx&&b.right>cx&&b.top<cy&&b.bottom>cy;}).map(e=>e.id||e.className);
      return {h:r.height,vh:innerHeight,cx:cx/innerWidth,cy:cy/innerHeight,ui,src:document.querySelector('.heroLiveBase46').currentSrc,nat:document.querySelector('.heroLiveBase46').naturalHeight};});
    assert.ok(m.h>=m.vh*0.6,`mascot >=60% height @${w}`);
    assert.match(m.src,/lobby_idle\.webp/);
    assert.ok(m.nat>=1500,'hi-res lobby art');
    assert.ok(m.cx>0.38&&m.cx<0.62&&m.cy<0.3,`face centred and high @${w}: ${m.cx},${m.cy}`);
    assert.deepEqual(m.ui,[],`face not covered by UI @${w}`);
    await page.locator('.heroTap46').first().click({force:true});
    await page.waitForFunction(()=>document.querySelector('.mascotBubble46.on')&&document.querySelector('#heroLive46.expr46'));
    assert.match(await page.locator('.mascotBubble46').innerText(),/月城小夜/);
    await context.close();
  }
  // setting cycles mascot independently of selected operator, persisted in save.settings
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(entry).href);
  await page.locator('.bootArt35').waitFor({state:'detached'});
  await page.locator('#menu button').filter({hasText:'设置'}).first().click();
  await page.locator('#mascotSetting46').waitFor();
  assert.match(await page.locator('#mascotSetting46').innerText(),/跟随出战角色/);
  await page.locator('#mascotSetting46').click();
  await page.locator('#mascotSetting46').click();
  assert.match(await page.locator('#mascotSetting46').innerText(),/神代绫/);
  await page.waitForFunction(()=>document.querySelector('#heroLive46').dataset.mascot==='aya');
  const saved=await page.evaluate(()=>Object.values(localStorage).map(v=>{try{return JSON.parse(v).settings?.mascot}catch{return null}}).filter(Boolean));
  assert.ok(saved.includes('aya'),'mascot choice persisted');
  await context.close();
  assert.deepEqual(errors,[]);
  console.log('MASCOT SMOKE PASS');
}finally{await browser.close();}

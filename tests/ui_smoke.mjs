import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:932,height:430}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(process.env.SAKURAYO_ENTRY||path.join(root,'src/index.html')).href+'?test=1');
  await page.waitForFunction(()=>window.__SAKURAYO_TEST__);
  const focused=()=>page.evaluate(()=>document.activeElement.id);
  const inside=id=>page.evaluate(id=>document.getElementById(id).contains(document.activeElement),id);
  for(const room of ['gacha','roster','shop','stage','archive']) {
    const launcher=page.locator(`#menu [data-open="${room}"]`).first();
    await launcher.focus(); await launcher.click();
    assert.equal(await inside(room+'Drawer'),true,room+' receives focus on open');
    for(let i=0;i<35;i++) {await page.keyboard.press('Tab'); assert.equal(await inside(room+'Drawer'),true,room+' traps Tab');}
    await page.keyboard.press('Shift+Tab');assert.equal(await inside(room+'Drawer'),true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#'+room+'Drawer').isVisible(),false,room+' closes on Escape');
    assert.equal(await launcher.evaluate(el=>el===document.activeElement),true,room+' returns focus to launcher');
    await launcher.click();await page.locator('#'+room+'Drawer > .dhead .close').click();
    assert.equal(await launcher.evaluate(el=>el===document.activeElement),true,room+' close button returns focus');
  }
  await page.locator('#commandPrepare47').click();
  await page.locator('#commandStage47').click();
  assert.equal(await inside('stageDrawer'),true,'command → stage receives focus');
  await page.keyboard.press('Escape');assert.equal(await focused(),'commandPrepare47','route returns to original launcher');
  await page.locator('#commandPrepare47').click();await page.locator('#commandRole47').click();
  await page.keyboard.press('Escape');assert.equal(await focused(),'commandPrepare47','command panel replacement keeps launcher');
  await page.locator('#commandPrepare47').click();await page.locator('#commandCards47').click();
  const slot=page.locator('#rosterWall46 [data-card]').first();await slot.click();
  assert.equal(await inside('rosterPeek46'),true,'detail receives focus');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#rosterPeek46').count(),0,'Escape closes detail before parent');
  assert.equal(await page.locator('#rosterDrawer').isVisible(),true);
  assert.equal(await slot.evaluate(el=>document.activeElement===el),true,'detail returns to source card');
  await page.keyboard.press('Escape');assert.equal(await focused(),'commandPrepare47','nested route returns to original launcher');
  await page.locator('#commandSettings47').click();await page.locator('#commandGuide48').click();
  assert.equal(await inside('tutorialDrawer37'),true,'dynamic tutorial joins lifecycle');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#tutorialDrawer37').isVisible(),false);
  await page.locator('#commandPrepare47').click();
  for(const modal of ['dialogue','event','level','paused','result']) {
    await page.evaluate(id=>document.getElementById(id).classList.remove('hidden'),modal);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#commandDrawer47').isVisible(),true,modal+' overlay takes priority');
    await page.evaluate(id=>document.getElementById(id).classList.add('hidden'),modal);
  }
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  console.log('PASS UI smoke: five rooms, root routes, nested detail, legacy tutorial, five modal priorities');
} finally {await browser.close();}

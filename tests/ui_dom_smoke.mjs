import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage();
  await page.setContent(`<style>.hidden{display:none}</style><button id="launcher">Open</button>
    <section class="drawer hidden" id="one"><h2>One</h2><button class="close" id="first">Close</button><input id="input"><button disabled>Disabled</button><span hidden><button>Hidden</button></span><a href="#" id="last">Link</a></section>
    <section class="drawer hidden" id="two"><h2>Two</h2><button class="close" id="second">Close</button></section><section id="dialogue" class="hidden">Story</section>`);
  await page.addScriptTag({path:path.join(root,'src/runtime/sakurayo-ui.js')});
  const result=await page.evaluate(()=>{
    const ui=window.SakurayoUI,one=document.getElementById('one'),two=document.getElementById('two');
    document.getElementById('launcher').focus();ui.open(one);
    const initial=document.activeElement.id,role=one.getAttribute('role');
    document.getElementById('last').focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
    const wrapped=document.activeElement.id;
    document.getElementById('first').focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));
    const reverse=document.activeElement.id;
    document.getElementById('input').focus();let disposed=0;
    const detail=document.createElement('div');detail.innerHTML='<button id="detailClose">Close detail</button>';one.appendChild(detail);
    ui.open(detail,{nested:true,onClose:()=>{disposed++;detail.remove();}});ui.close(detail);
    const parent=document.activeElement.id;
    ui.open(two);ui.closeAll();const launcher=document.activeElement.id;
    ui.open(one);document.getElementById('dialogue').classList.remove('hidden');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    const blocked=!one.classList.contains('hidden');document.getElementById('dialogue').classList.add('hidden');
    ui.closeAll();ui.open(one);one.remove();ui.closeAll();
    return {initial,role,wrapped,reverse,parent,disposed,launcher,blocked,disconnected:document.activeElement.id};
  });
  assert.deepEqual(result,{initial:'first',role:'dialog',wrapped:'first',reverse:'last',parent:'input',disposed:1,launcher:'launcher',blocked:true,disconnected:'launcher'});
  console.log('PASS UI DOM smoke: actual focus cycle, nested disposal, route launcher, modal priority, disconnected root');
} finally {await browser.close();}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const code=fs.readFileSync(new URL('../src/runtime/sakurayo-content-runtime.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../src/index.html',import.meta.url),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
function runtime(){const context={window:{},console:{error(){}}};vm.createContext(context);vm.runInContext(code,context);return context.window.SakurayoContent;}
function pack(id,extra={}){return {id,version:1,apiVersion:2,...extra};}
test('F22 default record/array shapes and all receipt fields survive serialized reload',()=>{
  const c=runtime();c.register(pack('test.receipts',{saveDefaults:{nested:{keep:4},list:['default'],purchases:{starter:1}}}));
  const save=c.migrateSave({extensions:{'test.receipts':{__version:1,data:{nested:[],list:{bad:true},purchases:[],collected:[],visits:[],choices:[],fragments:{bad:true},custom:{retained:5}}}}});
  const d=c.state(save,'test.receipts');
  assert.deepEqual(plain(d.nested),{keep:4});assert.deepEqual(plain(d.list),['default']);
  assert.deepEqual(plain(d.purchases),{starter:1});
  for(const key of ['collected','visits','choices'])assert.deepEqual(plain(d[key]),{});
  assert.deepEqual(plain(d.fragments),[]);assert.equal(d.custom.retained,5);
  d.purchases.manual=1;d.collected.cache=true;d.visits.scene=1;d.choices.echo='keep';d.fragments.push('fragment');
  const again=c.state(c.migrateSave(plain(save)),'test.receipts');
  assert.equal(again.purchases.manual,1);assert.equal(again.collected.cache,true);assert.equal(again.visits.scene,1);assert.equal(again.choices.echo,'keep');assert.deepEqual(plain(again.fragments),['fragment']);
});
test('F22 packs without defaults normalize before and after migration',()=>{
  const c=runtime();c.register(pack('test.migration',{version:2,migrations:[{from:1,to:2,set:{purchases:[],choices:[],fragments:{broken:true}},remove:['visits']}]}));
  const save=c.migrateSave({extensions:{'test.migration':{__version:1,data:{collected:[],visits:[],purchases:[],choices:[],fragments:{},keep:8}}}});
  const d=c.state(save,'test.migration');assert.equal(d.keep,8);
  for(const key of ['purchases','collected','visits','choices'])assert.deepEqual(plain(d[key]),{});
  assert.deepEqual(plain(d.fragments),[]);assert.equal(save.extensions['test.migration'].__version,2);
  const fresh=c.state(c.migrateSave({}),'test.migration');assert.deepEqual(plain(fresh.purchases),{});assert.deepEqual(plain(fresh.fragments),[]);
});
test('F24 conflict disables downstream content, events and hooks consistently',()=>{
  const c=runtime();c.register(pack('test.aaa'));c.register(pack('test.bbb',{conflicts:['test.aaa']}));c.register(pack('test.ccc',{dependencies:['test.bbb'],stories:[{id:'story-c'}]}));c.register(pack('test.ddd',{dependencies:['test.ccc']}));
  const calls=[];for(const owner of ['test.aaa','test.bbb','test.ccc','test.ddd','core.ops46']){c.on('test:event',()=>calls.push('event:'+owner),owner);c.hook('test:hook',()=>calls.push('hook:'+owner),owner);}
  assert.equal(c.finalize(),1);assert.deepEqual(plain(c.content('stories')),[]);assert.equal(c.state(c.migrateSave({}),'test.ccc'),null);
  c.emit('test:event',{});c.runHooks('test:hook',{});
  assert.deepEqual(calls,['event:test.aaa','event:core.ops46','hook:test.aaa','hook:core.ops46']);
  assert.equal(c.packs().find(x=>x.id==='test.ccc').enabled,false);assert.ok(c.errors().some(x=>x.packId==='test.ccc'&&x.phase==='compatibility'));
});
test('owner callback failures are logged while following callbacks run',()=>{
  const c=runtime(),calls=[];c.on('test:event',()=>{throw Error('event isolated');},'core.one');c.on('test:event',()=>calls.push('event'),'core.two');c.hook('test:hook',()=>{throw Error('hook isolated');},'core.one');c.hook('test:hook',()=>calls.push('hook'),'core.two');c.emit('test:event');c.runHooks('test:hook');assert.deepEqual(calls,['event','hook']);assert.deepEqual(plain(c.errors().map(x=>x.phase)),['event:test:event','hook:test:hook']);
});
test('real extension shop callback and test API use current receipts and wallet',()=>{
  const item={__packId:'test.shop',id:'manual',price:25,max:2,n:'manual',i:'book',d:'description'},callbacks=[];
  const section={style:{},dataset:{},appendChild(){}},tabs={appendChild(){},querySelectorAll(){return [];}},box={querySelector(selector){return selector==='.shopTabs40'?tabs:null;},querySelectorAll(){return [];},appendChild(){}};
  const context={save:{coins:100,extensions:{'test.shop':{data:{purchases:{}}}}},CONTENT41:{content:()=>[item],guard:(_owner,_phase,fn)=>fn(),emit(){}},extensionState41:null,document:{createElement:()=>section},$:()=>box,shopCard40:(_i,_n,_d,_label,_disabled,callback)=>{callbacks.push(callback);return {};},htmlEscape:x=>x,checkAch(){},persist(){},toast(){},renderShop35(){},bindShopTabs40(){}};
  context.extensionState41=id=>context.save.extensions[id].data;vm.createContext(context);
  const start=html.indexOf('  function extensionItemCount41('),end=html.indexOf('  const _renderShopExtension41=',start);assert.ok(start>=0&&end>start);vm.runInContext(html.slice(start,end),context);
  context.renderExtensionShop41();assert.equal(callbacks.length,1);
  callbacks[0]();assert.equal(context.save.coins,75);callbacks[0]();assert.equal(context.save.coins,50);callbacks[0]();assert.equal(context.save.coins,50);assert.equal(context.save.extensions['test.shop'].data.purchases.manual,2);
  context.save.extensions['test.shop'].data={purchases:{manual:1}};context.save.coins=24;callbacks[0]();assert.equal(context.save.coins,24);context.save.coins=100;callbacks[0]();assert.equal(context.save.coins,75);assert.equal(context.save.extensions['test.shop'].data.purchases.manual,2);
  const apiEntry=html.match(/      buyExtensionItem41\(packId,itemId\)\{[^\n]+\},/)[0].trim().replace(/,$/,'');context.item=item;vm.runInContext('testApi={'+apiEntry+'};',context);
  context.save.extensions['test.shop'].data={purchases:{}};context.save.coins=100;assert.equal(context.testApi.buyExtensionItem41('test.shop','manual'),true);assert.equal(context.save.coins,75);assert.equal(context.save.extensions['test.shop'].data.purchases.manual,1);
});

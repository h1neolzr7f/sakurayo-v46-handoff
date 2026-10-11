import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('src/index.html','utf8');
const start=html.indexOf('  /* ================= PLATFORM LIFECYCLE / EXPORT ================= */');
assert.ok(start>=0,'production platform entry points must exist');
const code=html.slice(start,html.indexOf('\n  checkAch();',start));
let calls=[],active=null,playing=false,hidden=new Set();
const s={window:{SakurayoUI:{active:()=>active,close:e=>{calls.push(e);active=null;}},SakurayoCutscene:{isPlaying:()=>playing,skipBeat:()=>calls.push('beat'),suspend:()=>calls.push('cutSuspend'),resume:()=>calls.push('cutResume')}},state:'menu',exploration41:null,exploreFrame41:9,exploreLast41:123,audio:null,feedbackPools411:new Map(),releaseInputs40:()=>calls.push('release'),pauseGame:()=>{calls.push('pause');s.state='pause';},resumeGame:()=>calls.push('resume'),nextDialogue:()=>calls.push('dialogue'),backMenu:()=>calls.push('menu'),closeExploreEvent412:x=>calls.push('event'),closeExploration41:()=>calls.push('explore'),cancelAnimationFrame:n=>calls.push(['cancel',n]),requestAnimationFrame:f=>{calls.push('raf');return 10;},exploreLoop41(){},$:(id)=>({classList:{contains:()=>hidden.has(id)}}),document:{addEventListener(){},createElement:()=>({click:()=>calls.push('download')})},addEventListener(){},Blob,URL:{createObjectURL:()=> 'blob:a',revokeObjectURL(){}},setTimeout:fn=>fn(),toast:x=>calls.push(x)};
vm.createContext(s);vm.runInContext(code,s);
const p=s.window.SakurayoPlatform;
assert.equal(p.back(),false);
active='nested';s.state='dialogue';p.back();assert.deepEqual(calls,['dialogue']);calls=[];
playing=true;p.back();assert.deepEqual(calls,['beat']);playing=false;calls=[];
for(const state of ['level','event']){s.state=state;assert.equal(p.back(),true);assert.deepEqual(calls,[]);}
s.state='result';p.back();assert.deepEqual(calls,['menu']);calls=[];
s.state='pause';p.back();assert.deepEqual(calls,['resume']);calls=[];
s.state='menu';p.back();assert.deepEqual(calls,['nested']);calls=[];
s.exploration41={x:100,activeEvent412:{}};p.back();assert.deepEqual(calls,['event']);calls=[];s.exploration41.activeEvent412=null;p.back();assert.deepEqual(calls,['explore']);calls=[];
s.state='play';p.suspend();assert.equal(s.state,'pause');assert.equal(s.exploration41.x,100);assert.deepEqual(calls,['release','pause',['cancel',9],'cutSuspend']);calls=[];p.suspend();assert.deepEqual(calls,[]);p.resume();assert.equal(s.exploreLast41,0);assert.deepEqual(calls,['raf','cutResume']);assert.equal(s.state,'pause');calls=[];
s.window.SakurayoAndroid={exportJson:(name,text)=>calls.push([name,text])};s.exportJson48('樱夜.json','{"名字":"小夜"}');assert.deepEqual(calls,[['樱夜.json','{"名字":"小夜"}']]);
// Real oscillator function: zero settings must avoid allocating either source node.
const soundCode=html.slice(html.indexOf('  function sound(k)'),html.indexOf('  function down(e)'));
let allocated=0;s.audio={createOscillator:()=>{allocated++;throw Error('unexpected source');}};s.save={settings:{master:0,sfx:1}};s.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));vm.runInContext(soundCode,s);s.sound('shot');assert.equal(allocated,0);s.save.settings={master:1,sfx:0};s.sound('shot');assert.equal(allocated,0);
// Real sample function and promise rejection handling.
s.TEST_MODE=false;s.FEEDBACK_AUDIO411={click:'click.ogg'};s.artUrl=x=>x;s.Audio=class {constructor(){allocated++;} paused=true;ended=false;pause(){}play(){return Promise.reject({name:'DecodeError'});}};
let reported=[];s.window.__SAKURAYO_DEV__={report:(kind,error)=>reported.push(error.name)};
s.save.settings={master:0,sfx:1};
vm.runInContext(html.slice(html.indexOf('  function playFeedback411('),html.indexOf('  const _soundFeedback411=')),s);
assert.equal(s.playFeedback411('click'),false);assert.equal(allocated,0);
s.save.settings={master:1,sfx:0};assert.equal(s.playFeedback411('click'),false);assert.equal(allocated,0);
s.save.settings={master:1,sfx:1};assert.equal(s.playFeedback411('click'),true);await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(reported,['DecodeError']);
s.reportAudio48({name:'NotAllowedError'});s.reportAudio48({name:'AbortError'});assert.deepEqual(reported,['DecodeError']);
// Muted music must not create its persistent oscillator pair.
let ensured=0;s.ensureAudio=()=>ensured++;s.music37=null;
vm.runInContext(html.slice(html.indexOf('  function ensureMusic37()'),html.indexOf('  function setMusic37(')),s);
s.save.settings={master:0,music:1};s.ensureMusic37();assert.equal(ensured,0);
s.save.settings={master:1,music:0};s.ensureMusic37();assert.equal(ensured,0);
// Existing music sources receive a literal zero target, with no minimum floor.
let targets=[];s.ensureMusic37=()=>{};s.musicGain37={gain:{cancelScheduledValues(){},linearRampToValueAtTime:x=>targets.push(x)}};s.music37=null;s.musicMode37='';s.audio={currentTime:0};
vm.runInContext(html.slice(html.indexOf('  function setMusic37('),html.indexOf('  function ensureSettings37()')),s);
s.save.settings={master:0,music:1};s.setMusic37(true,0,true);s.save.settings={master:1,music:0};s.setMusic37(true,0,true);s.setMusic37(false,0,true);assert.deepEqual(targets,[0,0,0]);
// A native resume arriving before visibility returns must retain every suspended resource.
calls=[];s.audio={state:'running',suspend:()=>{calls.push('audioSuspend');s.audio.state='suspended';return Promise.resolve();},resume:()=>{calls.push('audioResume');return Promise.resolve();}};
const track={paused:false,ended:false,pause:()=>calls.push('samplePause'),play:()=>{calls.push('samplePlay');return Promise.resolve();}};
s.feedbackPools411=new Map([['click',[track]]]);s.save.settings={master:1,sfx:1};s.exploration41={x:100};s.exploreFrame41=9;s.exploreLast41=123;s.state='play';p.suspend();
assert.deepEqual(calls,['release','pause',['cancel',9],'cutSuspend','samplePause','audioSuspend']);calls=[];
s.document.hidden=true;p.resume();p.resume();
assert.deepEqual(calls,[],'hidden native resume must not restart RAF, cutscene, context or samples');
assert.equal(s.exploreFrame41,0);assert.equal(s.exploreLast41,123);assert.equal(s.state,'pause');
s.document.hidden=false;p.resume();
assert.deepEqual(calls,['raf','cutResume','audioResume','samplePlay'],'visible resume must retain and restart suspended resources once');
assert.equal(s.exploreLast41,0);assert.equal(s.state,'pause');calls=[];p.resume();assert.deepEqual(calls,[]);
console.log('platform_unit PASS: modal priority, lifecycle, Unicode bridge, strict zero sources/gain, observable errors');

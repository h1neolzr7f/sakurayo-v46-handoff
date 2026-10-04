(function (global) {
  'use strict';

  // The command room owns presentation and finite supply receipts, never combat.
  var SUPPLIES = [
    {id:'firstRun',title:'初次出击补给',desc:'完成第一场战斗，无论胜败。',reward:120,test:function(s){return Number(s.runs)>=1;}},
    {id:'chapter1',title:'第一章 · 神社回收',desc:'完成第一章后领取。',reward:180,chapter:1},
    {id:'chapter2',title:'第二章 · 霓虹追缉',desc:'完成第二章后领取。',reward:260,chapter:2},
    {id:'chapter3',title:'第三章 · 剑冢证词',desc:'完成第三章后领取。',reward:360,chapter:3},
    {id:'chapter4',title:'第四章 · 终夜归航',desc:'完成第四章后领取。',reward:480,chapter:4},
    {id:'kills500',title:'防线补给 · 五百击破',desc:'累计击破 500 名敌人。',reward:200,test:function(s){return Number(s.kills)>=500;}}
  ];
  var options = null;
  var currentPanel = '';
  var returnFocus = null;
  var panelCharacter = '';
  var ESC = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return ESC[c];});}
  function inbox(save){
    var s=save||{}, receipts=s.shop40&&s.shop40.ops&&s.shop40.ops.supplies||{};
    var done=Array.isArray(s.done)?s.done:[];
    return SUPPLIES.map(function(item){
      return {id:item.id,title:item.title,desc:item.desc,reward:item.reward,
        ready:item.chapter?done.indexOf(item.chapter)>=0:item.test(s),claimed:receipts[item.id]===true};
    });
  }
  function claimSupply(save,id){
    var row=inbox(save).filter(function(r){return r.id===id;})[0];
    if(!row)return {ok:false,reason:'unknown',reward:0};
    if(row.claimed)return {ok:false,reason:'claimed',reward:0};
    if(!row.ready)return {ok:false,reason:'locked',reward:0};
    if(!save.shop40||typeof save.shop40!=='object'||Array.isArray(save.shop40))save.shop40={};
    if(!save.shop40.ops||typeof save.shop40.ops!=='object'||Array.isArray(save.shop40.ops))save.shop40.ops={};
    var receipts=save.shop40.ops.supplies;
    if(!receipts||typeof receipts!=='object'||Array.isArray(receipts))receipts={};
    receipts[id]=true;
    save.shop40.ops.supplies=receipts;
    var coins=Number(save.coins);
    save.coins=(Number.isFinite(coins)?Math.max(0,coins):0)+row.reward;
    return {ok:true,reason:'',reward:row.reward};
  }
  var CSS = `
    :root{--cmd-ink:#080e1c;--cmd-paper:#edf0fa;--cmd-dim:#b2bbd1;--cmd-line:#d5dbed26;--cmd-pink:#f4acc7;--cmd-gold:#ead4a1}
    button{cursor:pointer}button:focus-visible{outline:2px solid #f4acc7;outline-offset:3px}button:disabled{cursor:default}
    html.landscape46 #menu.homeDock46 .bg{inset:0;filter:none!important;background-position:center!important}
    #menu.homeDock46 .bg:after{background:linear-gradient(90deg,#070d1918 20%,#070d1900 45%,#070d19b0 72%,#070d19ed),linear-gradient(0deg,#080e1cb0,transparent 28%)!important}
    html.landscape46 #menu.homeDock46 #coverTitle36{top:max(22px,env(safe-area-inset-top));left:max(28px,env(safe-area-inset-left));max-width:48%;text-shadow:none}
    #menu.homeDock46 .coverTitle36 b{font-size:clamp(22px,3vw,40px)!important;letter-spacing:.14em!important;background:none;color:#f5f0f1;font-weight:700}
    #menu.homeDock46 .coverTitle36 span{border:0;border-radius:0;background:none;padding:6px 0;color:#ccd0dd;font-size:9px;letter-spacing:.23em}
    html.landscape46 #menu.homeDock46 .heroLive46{width:64%;mask-image:linear-gradient(90deg,#000 0%,#000 88%,transparent);-webkit-mask-image:linear-gradient(90deg,#000 0%,#000 88%,transparent)}
    html.landscape46 #menu.homeDock46 .heroLiveBreath46{width:53vw;height:94%;margin-left:8vw}
    html.landscape46 #menu.homeDock46 .heroLiveBreath46 img{object-position:center bottom}
    html.landscape46 #menu.homeDock46 .heroLiveName46{bottom:13%;left:7%;max-width:56%;top:auto;border-left:2px solid #f4acc7;padding:7px 14px;background:linear-gradient(90deg,#080e1cc2,transparent);text-shadow:0 2px 8px #000}
    #menu.homeDock46 .heroLiveName46 b{font-size:clamp(20px,3vw,34px);font-weight:650;letter-spacing:.17em}
    #menu.homeDock46 .heroLiveName46 small{color:#d0d7e7;font-size:10px;letter-spacing:.14em}
    html.landscape46 #menu.homeDock46 .menu{width:34%;max-width:430px;margin:0 3% 0 auto;height:100%;padding:22px 0 18px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;border:0;background:none;border-radius:0;box-shadow:none;overflow:visible}
    #menu.homeDock46 .menu>.top{margin:0 0 auto;padding:0;min-height:40px;background:none;border:0;gap:10px;justify-content:flex-end}
    #menu.homeDock46 .menuBrand35{display:none}
    #menu.homeDock46 .coins{margin:0 auto 0 0;padding:8px 12px;border-radius:3px!important;background:#101a2ecc!important;border:1px solid var(--cmd-line)!important;color:var(--cmd-gold);font-size:13px}
    #menu.homeDock46 #moreButton39{width:42px;height:40px;min-height:40px;padding:0;background:#101a2ecc;border:1px solid var(--cmd-line);border-radius:3px;font-size:11px}
    #menu.homeDock46 .calmUtility39.open39{top:65px;right:0;border-radius:4px;width:220px!important;background:#0d1729fa;border-color:var(--cmd-line)}
    #menu.homeDock46 .calmUtility39.open39>button{min-height:40px;border-radius:3px;background:#ffffff08;border-color:var(--cmd-line)}
    .commandHeading47{position:relative;padding:0 0 8px 43px;border-bottom:1px solid var(--cmd-line)}
    .commandHeading47 picture{position:absolute;left:0;top:8px;width:34px;height:34px;pointer-events:none}.commandHeading47 picture img{width:100%;height:100%;object-fit:contain}
    .commandHeading47 small{font-size:8px;color:var(--cmd-pink);letter-spacing:.25em}
    .commandHeading47 b{display:block;margin-top:4px;font-size:20px;font-weight:600;letter-spacing:.18em}
    .commandHeading47 p{margin:4px 0 0;color:var(--cmd-dim);font-size:10px}
    html.landscape46 #menu.homeDock46 .charSelectPanel{margin:0!important;padding:0;background:none;border:0}
    html.landscape46 #menu.homeDock46 .characterList{gap:8px}
    html.landscape46 #menu.homeDock46 .charCard{max-width:none!important;width:100%;height:60px!important;aspect-ratio:auto;margin:0;padding:3px 0!important;border:1px solid #d5dbed30;border-radius:3px;background:#101a2ecc;display:flex;align-items:center;justify-content:center;gap:6px;overflow:hidden}
    html.landscape46 #menu.homeDock46 .charCard img{width:42px!important;height:49px!important;object-fit:cover;object-position:center 18%;border-radius:0}
    html.landscape46 #menu.homeDock46 .charCard b{display:block;font-size:10px;font-weight:500;writing-mode:vertical-rl;letter-spacing:.1em}
    html.landscape46 #menu.homeDock46 .charCard.selected{border-color:var(--cmd-pink);background:linear-gradient(135deg,#c364851d,#101a2ee0);box-shadow:inset 0 -2px var(--cmd-pink)}
    #menu.homeDock46 .charCard .selectedMark,#menu.homeDock46 .charCard em,#menu.homeDock46 .charCard p{display:none!important}
    html.landscape46 #menu.homeDock46 .stageMini{position:relative;cursor:pointer;margin:0;padding:12px;min-height:73px;grid-template-columns:64px 1fr auto;border-radius:3px;background:#101a2ecd;border:1px solid var(--cmd-line);backdrop-filter:none}
    #menu.homeDock46 .stageMini img{width:64px;height:45px;object-fit:cover;border-radius:1px}
    #menu.homeDock46 .stageMini h3{font-size:14px;font-weight:600;letter-spacing:.06em}
    #menu.homeDock46 .stageMini p{display:block;margin:4px 0 0;font-size:9px;color:var(--cmd-dim);line-height:1.4}
    #menu.homeDock46 .stageMini strong{font-size:22px;font-weight:400;color:var(--cmd-gold)}
    html.landscape46 #menu.homeDock46 .start{min-height:54px;margin:0;padding:12px;font-size:20px;font-weight:650;letter-spacing:.6em;border-radius:3px;background:linear-gradient(110deg,#f1dac0,#dca6b6)!important;color:#24243c!important;text-shadow:none;border:1px solid #f9e8d2;box-shadow:0 6px 26px #0003}
    .commandLinks47{display:flex;gap:7px;pointer-events:auto}.commandLinks47 button{flex:1;min-height:40px;border:1px solid var(--cmd-line);background:#101a2ecc;border-radius:3px;color:#dfe4f2;font-size:11px}
    html.landscape46 #menu.homeDock46 .homeNav46{padding:0;background:none;border:0;border-radius:0;gap:5px;margin:0}
    #menu.homeDock46 .homeNav46 button{min-height:64px;padding:7px 1px;border:0;border-top:1px solid var(--cmd-line);border-radius:0;background:linear-gradient(#101a2e80,#101a2e10);font-weight:500;font-size:11px;letter-spacing:.08em;box-shadow:none}
    #menu.homeDock46 .homeNav46 button span{width:30px;height:30px;background:none;border-radius:0;margin-bottom:5px}
    #menu.homeDock46 .homeNav46 button span img{border-radius:0}
    .commandRail47{position:absolute;z-index:6;left:max(28px,env(safe-area-inset-left));top:105px;display:flex;gap:8px}
    .commandRail47 button{height:40px;min-width:52px;padding:8px 12px;border:1px solid var(--cmd-line);background:#080e1cbd;border-radius:3px;font-size:11px;color:#e9e9f4}
    .commandRail47 button i{font-style:normal;font-size:10px;margin-left:6px;color:#eed5a1}
    .commandSignal47{position:absolute;left:max(28px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));z-index:6;max-width:55%;display:flex;align-items:center;gap:9px;color:#c3cbdb;font-size:9px;letter-spacing:.12em}
    .commandSignal47:before{content:'';width:5px;height:5px;border-radius:50%;background:#acd4ca;box-shadow:0 0 10px #acd4ca60}
    .drawer:not(.wishDrawer46){background:radial-gradient(ellipse at 15% 0,#22324b70,transparent 50%),#0a1020!important;color:var(--cmd-paper)}
    .drawer>.dhead{border-color:var(--cmd-line)!important;background:none!important}
    .drawer>.dhead h2{color:var(--cmd-paper)!important;text-shadow:none!important;font-size:20px;font-weight:600;letter-spacing:.13em!important}
    .drawer .close{border-radius:3px!important;border-color:var(--cmd-line)!important;background:#1b263bcc!important;min-width:40px;min-height:40px}
    #archiveDrawer .archiveDock46 button{border-radius:4px;border-color:var(--cmd-line);position:relative;padding:24px;min-height:220px}
    #archiveDrawer .archiveDock46 button b{font-weight:600;font-size:20px}
    #archiveDrawer .archiveDock46 button small{color:#c1cada}
    #stageList .stageCard{border-radius:4px;border-color:var(--cmd-line);box-shadow:none}
    #stageList .stageCard .i{padding-top:90px}
    #stageList .stageCard button,.modeBar46 button.on{background:#dbc0be!important;color:#252638!important;border-radius:3px!important;border-color:#eddddd!important;box-shadow:none}
    #stageList .modeBar46{grid-column:1/-1;margin-bottom:4px}
    .modeBar46 button{min-height:56px;border-radius:3px;background:#152038;border-color:var(--cmd-line);font-weight:600}
    .modeBar46 button small,.modeBar46 button.on small{color:inherit}
    #shopDrawer .skinCard,#shopDrawer .shopItem40,#shopWallet44,#shopDrawer .shopTabs40,#shopDrawer .shopTabs40 button{border-radius:4px;border-color:var(--cmd-line);background:#131e32;box-shadow:none}
    #shopDrawer .shopTabs40 button.on{background:#dbc0be;color:#252638;border-color:#eddddd}
    #shopDrawer .skinPreview{border-radius:0;background-color:#152339}
    #shopDrawer .skinCard>button,#shopDrawer .shopItem40 button,#shopDrawer .shopUpgrade40{min-height:40px;border-radius:3px!important;background:#dbc0be!important;color:#252638!important;border-color:#eddddd!important}
    .wishStage46{background:#0a1020}.wishTitle46 b{text-shadow:none}.wishTitle46 p{color:#e0dbe5}.wishDock46{border-radius:4px;border-color:var(--cmd-line);background:#0c1425e0;box-shadow:none}
    .wishPull46{border-radius:3px;min-height:44px}.rosterSlot46,.rosterPeekCard46{border-radius:4px;border-color:var(--cmd-line)}
    #talentDrawer .talent,#storyDrawer .storyCard,#ascDrawer .storyCard,#achDrawer .ach{border-radius:4px!important;background:#131e32!important;border-color:var(--cmd-line)!important;box-shadow:none}
    #commandDrawer47{padding:18px max(22px,env(safe-area-inset-right)) 20px;overflow:auto;z-index:22;touch-action:pan-y}
    #commandDrawer47 .dhead{max-width:1200px;margin:0 auto 16px;padding:4px 0 12px;display:flex;align-items:center;gap:14px;border-bottom:1px solid var(--cmd-line)}
    #commandDrawer47 .dhead small{display:block;margin-bottom:5px;font-size:9px;color:var(--cmd-pink);letter-spacing:.2em}
    #commandBody47{max-width:1200px;margin:auto;display:block}
    .cmdSplit47{display:grid;grid-template-columns:minmax(200px,42%) 1fr;gap:24px}
    .cmdPortrait47{position:relative;min-height:290px;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 80%,#36536c50,transparent 65%);overflow:hidden;border-bottom:1px solid var(--cmd-line)}
    .cmdPortrait47>img{width:100%;height:clamp(260px,65vh,520px);object-fit:contain;object-position:center top}
    .cmdPortrait47>small{position:absolute;bottom:12px;left:12px;letter-spacing:.3em;font-size:9px;color:#a9b9cf}
    .cmdSheet47{padding:10px 0}.cmdSheet47 h3{font-size:clamp(24px,4vw,44px);font-weight:550;letter-spacing:.13em;margin:14px 0 6px}
    .cmdSheet47 .cmdRole47{font-size:12px;color:var(--cmd-pink);letter-spacing:.12em}
    .cmdSheet47 p{color:var(--cmd-dim);line-height:1.75;font-size:12px}
    .cmdTabs47{display:flex;gap:8px;flex-wrap:wrap}.cmdTabs47 button{padding:8px 15px;min-height:40px;background:#19253b;border:1px solid var(--cmd-line);border-radius:3px;color:#ccd6e5;font-size:12px}
    .cmdTabs47 button.on{background:#dbc0be;color:#252638;border-color:#eddddd}
    .cmdTags47{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.cmdTags47 span{padding:5px 10px;border:1px solid var(--cmd-line);font-size:10px;color:#cee0eb}
    .cmdLoadout47{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}
    .cmdLoadout47>div{background:#141e32;border:1px solid var(--cmd-line);padding:12px;min-width:0;border-radius:3px}
    .cmdLoadout47 small{display:block;font-size:9px;color:#899ab5;letter-spacing:.12em;margin-bottom:6px}.cmdLoadout47 b{font-size:12px;font-weight:600}
    .cmdActions47{display:flex;gap:9px;margin:14px 0;flex-wrap:wrap}.cmdActions47 button{min-height:42px;padding:10px 22px;border-radius:3px;background:#19253b;border:1px solid var(--cmd-line);font-size:12px}
    .cmdActions47 button.primary47,.cmdSupply47 button{background:#dbc0be;color:#252638;border:1px solid #eddddd}
    .cmdMission47{min-height:170px;padding:24px;display:flex;flex-direction:column;justify-content:flex-end;background-size:cover;background-position:center;border:1px solid var(--cmd-line)}
    .cmdMission47 small{font-size:10px;color:var(--cmd-pink);letter-spacing:.1em}.cmdMission47 h3{font-size:25px;margin:8px 0}.cmdMission47 p{font-size:11px;margin:0;color:#d0d7e7}
    .cmdNotes47{padding:14px;border-left:2px solid var(--cmd-gold);background:#ead4a10a;color:#c9d3e5;font-size:11px;line-height:1.8}
    .cmdSupplies47{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cmdSupply47{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:12px;padding:16px;border:1px solid var(--cmd-line);background:#131e32;border-radius:3px}
    .cmdSupply47>span{width:40px;height:40px;display:grid;place-items:center;border:1px solid #ead4a145;color:var(--cmd-gold);font-size:20px}
    .cmdSupply47 b{font-size:13px;font-weight:600}.cmdSupply47 p{margin:5px 0;color:var(--cmd-dim);font-size:10px}.cmdSupply47 small{color:var(--cmd-gold);font-size:10px}
    .cmdSupply47 button{min-height:40px;padding:8px 14px;border-radius:3px;font-size:11px}.cmdSupply47 button:disabled{background:#152138;color:#8a9bb7;border-color:var(--cmd-line)}
    .cmdEmpty47{padding:30px;text-align:center;color:var(--cmd-dim);font-size:13px;border:1px solid var(--cmd-line)}
    .cmdHistory47{display:grid;gap:10px}.cmdRun47{display:grid;grid-template-columns:80px 1fr auto;gap:18px;align-items:center;padding:16px;background:#131e32;border:1px solid var(--cmd-line)}
    .cmdRun47 b{color:var(--cmd-gold);font-size:15px}.cmdRun47 p{margin:5px 0;color:var(--cmd-dim);font-size:11px}.cmdRun47 span{font-size:12px}
    @media(max-height:520px) and (min-width:641px){
      html.landscape46 #menu.homeDock46 .menu{padding:12px 0;gap:7px;max-width:390px}
      .commandHeading47 b{font-size:17px}.commandHeading47 p{font-size:9px}.commandHeading47{padding-bottom:5px}
      html.landscape46 #menu.homeDock46 .charCard{height:49px!important}html.landscape46 #menu.homeDock46 .charCard img{height:40px!important;width:32px!important}
      html.landscape46 #menu.homeDock46 .stageMini{min-height:58px;padding:7px 10px;grid-template-columns:49px 1fr auto}#menu.homeDock46 .stageMini img{width:49px;height:38px}
      html.landscape46 #menu.homeDock46 .start{min-height:46px;padding:9px;font-size:18px}.commandLinks47 button{min-height:40px;font-size:10px}
      #menu.homeDock46 .homeNav46 button{min-height:53px;font-size:10px;padding:6px 1px}#menu.homeDock46 .homeNav46 button span{width:23px;height:23px;margin-bottom:4px}
      html.landscape46 #menu.homeDock46 #coverTitle36{top:16px;left:24px}.commandRail47{top:83px;left:24px}
      #commandDrawer47{padding-top:10px}.cmdSheet47{padding:0}.cmdSheet47 h3{margin-top:10px}.cmdLoadout47{margin:10px 0}.cmdPortrait47>img{height:290px}
    }
    @media(max-width:640px){
      html.landscape46 #menu.homeDock46 .menu{width:46%;margin-right:3%;padding-top:20px;gap:10px}
      html.landscape46 #menu.homeDock46 .heroLive46{width:60%}html.landscape46 #menu.homeDock46 .heroLiveBreath46{width:80vw;margin-left:-10vw;height:75%}
      html.landscape46 #menu.homeDock46 #coverTitle36{left:14px;max-width:45%}.commandRail47{left:14px;top:110px;flex-direction:column;gap:7px}
      .commandRail47 button{min-height:40px;padding:8px}.commandSignal47{left:14px;max-width:45%;font-size:8px;line-height:1.6}
      .commandHeading47 b{font-size:15px}.commandHeading47 p{font-size:9px}html.landscape46 #menu.homeDock46 .charCard{height:56px!important;gap:1px}
      html.landscape46 #menu.homeDock46 .charCard img{width:28px!important;height:40px!important}html.landscape46 #menu.homeDock46 .charCard b{font-size:8px}
      html.landscape46 #menu.homeDock46 .stageMini{grid-template-columns:1fr auto;padding:10px;min-height:70px}#menu.homeDock46 .stageMini img{display:none}#menu.homeDock46 .stageMini h3{font-size:12px}
      #menu.homeDock46 .homeNav46 button{font-size:9px;min-height:54px}#menu.homeDock46 .homeNav46 button span{width:22px;height:22px}
      .cmdSplit47{grid-template-columns:1fr;gap:12px}.cmdPortrait47{min-height:200px}.cmdPortrait47>img{height:240px}.cmdSupplies47{grid-template-columns:1fr}
      .cmdSupply47{grid-template-columns:32px 1fr auto;padding:12px;gap:8px}.cmdRun47{grid-template-columns:58px 1fr;gap:10px}.cmdRun47>span{grid-column:2}
      #archiveDrawer .archiveDock46{grid-template-columns:1fr 1fr!important;min-height:0!important}#archiveDrawer .archiveDock46 button{min-height:170px;padding:16px}
    }
    @media(max-height:360px){html.landscape46 #menu.homeDock46 .menu{gap:4px;padding:8px 0}.commandHeading47{display:none}html.landscape46 #menu.homeDock46 .start{min-height:40px}.commandRail47{top:70px}.commandSignal47{font-size:8px}}
    @keyframes commandEnter47{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
    #commandDrawer47:not(.hidden) #commandBody47{animation:commandEnter47 .22s ease-out both}
    .commandLinks47 button,.commandRail47 button,.cmdActions47 button,.cmdTabs47 button{transition:background-color .15s,border-color .15s}
    @media(hover:hover){.commandLinks47 button:hover,.commandRail47 button:hover,.cmdActions47 button:hover{border-color:#f4acc7;background-color:#25324a}.cmdTabs47 button:hover{border-color:#f4acc7}}
    @media(prefers-reduced-motion:reduce){.heroLiveSway46,.heroLiveBreath46,#commandBody47{animation:none!important}.heroLivePhys46,.heroLiveLook46,.commandLinks47 button,.commandRail47 button,.cmdActions47 button,.cmdTabs47 button{transition:none!important}}
  `;
  function style(){
    var d=global.document,node=d.getElementById('sakurayo-command-css');
    if(!node){node=d.createElement('style');node.id='sakurayo-command-css';node.textContent=CSS;}
    if(d.head.lastElementChild!==node)d.head.appendChild(node); // last: lobby refresh may inject its older stylesheet again
  }
  function bind(selector,fn){var n=global.document.querySelector(selector);if(n)n.onclick=fn;}
  function loadout(model){
    return '<div class="cmdLoadout47">'+[['当前衣装',model.skin],['初始核心',model.starter],['武器道具',model.item],['排除符',model.talismans],['寻访时装',model.fashion],['寻访武器',model.weapon]].map(function(p){return '<div><small>'+p[0]+'</small><b>'+esc(p[1])+'</b></div>';}).join('')+'</div>';
  }
  function close(){
    var d=global.document.getElementById('commandDrawer47'),wasOpen=d&&!d.classList.contains('hidden');if(d)d.classList.add('hidden');
    currentPanel='';
    if(wasOpen&&returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});
    returnFocus=null;
  }
  function panel(kind,refresh){
    if(!options)return;
    var focused=global.document.activeElement;
    var focusId=refresh&&focused?focused.id:'';
    var focusCharacter=refresh&&focused&&focused.dataset?focused.dataset.character:'';
    if(!refresh){options.closeDrawers();returnFocus=focused;panelCharacter=options.model().character.id;}
    currentPanel=kind;
    var d=global.document,drawer=d.getElementById('commandDrawer47');
    if(!drawer){
      drawer=d.createElement('section');drawer.id='commandDrawer47';drawer.className='drawer hidden';
      drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-labelledby','commandTitle47');
      drawer.innerHTML='<div class="dhead"><div><small id="commandEyebrow47"></small><h2 id="commandTitle47"></h2></div><button class="close" type="button" aria-label="返回大厅">×</button></div><div id="commandBody47"></div>';
      d.body.appendChild(drawer);drawer.querySelector('.close').onclick=close;
    }
    var model=options.model(),titles={character:['OPERATOR FILE','作战角色'],prepare:['SORTIE PREPARATION','出击整备'],supplies:['RECOVERY SUPPLIES','回收补给'],history:['COMBAT RECORD','近期战绩']};
    d.getElementById('commandEyebrow47').textContent=titles[kind][0];
    d.getElementById('commandTitle47').textContent=titles[kind][1];
    var body=d.getElementById('commandBody47');
    if(kind==='character'){
      var c=model.characters.filter(function(x){return x.id===panelCharacter;})[0]||model.character;
      var active=c.id===model.character.id;
      body.innerHTML='<div class="cmdSplit47"><div class="cmdPortrait47"><img src="'+esc(options.art('characters/'+c.id+'/default/live_idle.webp'))+'" alt="'+esc(c.name)+'"><small>SAKURAYO / '+esc(c.id.toUpperCase())+'</small></div><div class="cmdSheet47"><div class="cmdTabs47">'+model.characters.map(function(x){return '<button data-character="'+esc(x.id)+'" class="'+(x.id===c.id?'on':'')+'">'+esc(x.name)+'</button>';}).join('')+'</div><h3>'+esc(c.name)+'</h3><div class="cmdRole47">'+esc(c.role)+' / '+esc(c.weapon)+'</div><p>'+esc(c.desc)+'</p><div class="cmdNotes47">'+esc(c.bonus)+'</div><div class="cmdTags47">'+c.schools.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>'+ (active?loadout(model):'<p>选择为出击角色后可查看当前装备。</p>')+'<div class="cmdActions47"><button class="primary47" id="commandSelect47">'+(active?'当前出击角色':'选择出击')+'</button><button id="commandWardrobe47">衣装与装备</button><button id="commandTalent47">永久天赋</button></div></div></div>';
      body.querySelectorAll('[data-character]').forEach(function(b){b.onclick=function(){panelCharacter=b.dataset.character;panel('character',true);};});
      bind('#commandSelect47',function(){options.selectCharacter(c.id);panelCharacter=c.id;panel('character',true);});
      bind('#commandWardrobe47',function(){close();options.open('shop');});
      bind('#commandTalent47',function(){close();options.open('talent');});
    }else if(kind==='prepare'){
      var m=model.mission;
      body.innerHTML='<div class="cmdSplit47"><div><div class="cmdMission47" style="background-image:linear-gradient(0deg,#080e1cf5,#080e1c20),url(&quot;'+esc(m.art)+'&quot;)"><small>'+esc(model.mode)+'</small><h3>'+esc(m.name)+'</h3><p>'+esc(m.boss)+' · 预计 '+esc(m.minutes)+' 分钟</p><p style="margin-top:8px;color:#ead4a1">'+esc(model.tactic)+'</p></div><div class="cmdActions47"><button id="commandStage47">更换模式 / 关卡</button></div><div class="cmdNotes47">'+esc(model.modeId==='testimony'?'证词模式：跟随剧情，不发放随机升级卡，也不部署干员。':'肉鸽战斗：自动攻击，移动避险；升级三选一构筑职业，局内完成转职、融合与三相飞升。')+'</div></div><div class="cmdSheet47"><div class="cmdRole47">当前出击角色</div><h3>'+esc(model.character.name)+'</h3><p>'+esc(model.character.weapon)+' · '+esc(model.character.role)+'</p>'+loadout(model)+'<div class="cmdActions47"><button id="commandLoadout47">调整装备</button><button id="commandCards47">寻访装备</button><button id="commandRole47">切换角色</button><button class="primary47" id="commandLaunch47">开始出击 →</button></div><p>移动：摇杆 / WASD　冲刺：空格　主动：技能按钮<br>另外两名角色可在肉鸽模式使用 DP 部署支援。</p></div></div>';
      bind('#commandStage47',function(){close();options.open('stage');});
      bind('#commandLoadout47',function(){close();options.open('shop');});
      bind('#commandCards47',function(){close();options.open('roster');});
      bind('#commandRole47',function(){panel('character');});
      bind('#commandLaunch47',function(){close();options.start();});
    }else if(kind==='supplies'){
      body.innerHTML='<p class="cmdNotes47">战斗与章节回收留下的补给。每份仅领取一次，完成记录保存在本机。</p><div class="cmdSupplies47">'+inbox(model.save).map(function(r){return '<article class="cmdSupply47"><span>'+ (r.claimed?'✓':r.ready?'✦':'◇')+'</span><div><b>'+esc(r.title)+'</b><p>'+esc(r.desc)+'</p><small>樱花币 +'+r.reward+'</small></div><button data-supply="'+r.id+'" '+(r.claimed||!r.ready?'disabled':'')+'>'+ (r.claimed?'已领取':r.ready?'领取':'待完成')+'</button></article>';}).join('')+'</div>';
      body.querySelectorAll('[data-supply]').forEach(function(b){b.onclick=function(){b.disabled=true;options.claim(b.dataset.supply);panel('supplies',true);};});
    }else{
      body.innerHTML=model.history.length?'<div class="cmdHistory47">'+model.history.slice(0,12).map(function(r){return '<article class="cmdRun47"><b>'+esc(r.win?'回收成功':'战斗结束')+'</b><div><strong>'+esc(r.character)+' · '+esc(r.stage)+'</strong><p>'+esc(r.mode)+' / Lv.'+esc(r.level)+' / '+esc(r.kills)+' 击破 / '+esc(r.duration)+'</p></div><span>'+esc(r.date)+'</span></article>';}).join('')+'</div>':'<div class="cmdEmpty47">暂无战绩。完成第一次出击后，回收记录会显示在这里。</div>';
    }
    drawer.classList.remove('hidden');
    var next=focusId&&d.getElementById(focusId);
    if(focusCharacter)next=Array.from(body.querySelectorAll('[data-character]')).find(function(b){return b.dataset.character===focusCharacter;});
    if(!refresh||!next||next.disabled)next=drawer.querySelector('.close');
    next.focus({preventScroll:true});
    style();
  }
  function mount(opts){
    options=opts;var d=global.document;if(!d)return;
    var root=d.getElementById('menu'),dock=root&&root.querySelector('.menu');if(!root||!dock)return;
    style();
    if(!d.getElementById('commandHeading47')){
      var h=d.createElement('div');h.className='commandHeading47';h.id='commandHeading47';h.innerHTML='<picture aria-hidden="true"><source media="(prefers-reduced-motion: reduce)" srcset="'+esc(options.art('ui/command-seal-still.webp'))+'"><img src="'+esc(options.art('ui/command-seal-loop.webp'))+'" alt=""></picture><small>SAKURAYO · COMMAND ROOM</small><b>今晚，继续守望。</b><p id="commandProgress47"></p>';
      dock.querySelector('.top').insertAdjacentElement('afterend',h);
      var links=d.createElement('div');links.className='commandLinks47';links.innerHTML='<button type="button" id="commandPrepare47">出击整备</button><button type="button" id="commandHistory47">近期战绩</button>';
      dock.querySelector('#start').insertAdjacentElement('afterend',links);
      var rail=d.createElement('div');rail.className='commandRail47';rail.id='commandRail47';rail.innerHTML='<button type="button" id="commandCharacter47">角色资料</button><button type="button" id="commandSupplies47">回收补给<i id="commandUnread47"></i></button><button type="button" id="commandSettings47">设置</button>';
      root.appendChild(rail);
      var signal=d.createElement('div');signal.className='commandSignal47';signal.id='commandSignal47';signal.textContent='离线作战就绪 · 数据保存在本机';root.appendChild(signal);
      d.addEventListener('keydown',function(e){
        var drawer=d.getElementById('commandDrawer47');if(!drawer||drawer.classList.contains('hidden'))return;
        if(e.key==='Escape'){e.preventDefault();close();return;}
        if(e.key==='Tab'){
          var all=Array.from(drawer.querySelectorAll('button:not(:disabled),[tabindex="0"]'));
          if(!all.length)return;var first=all[0],last=all[all.length-1];
          if(!drawer.contains(d.activeElement)){e.preventDefault();first.focus();}else if(e.shiftKey&&d.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&d.activeElement===last){e.preventDefault();first.focus();}
        }
      });
    }
    var m=options.model(),unread=inbox(m.save).filter(function(r){return r.ready&&!r.claimed;}).length;
    d.getElementById('commandProgress47').textContent='四章回收 '+m.completed+' / 4 · '+m.mode;
    d.getElementById('commandUnread47').textContent=unread?String(unread):'';
    bind('#commandCharacter47',function(){panel('character');});
    bind('#commandSupplies47',function(){panel('supplies');});
    bind('#commandSettings47',function(){options.settings();});
    bind('#commandPrepare47',function(){panel('prepare');});
    bind('#commandHistory47',function(){panel('history');});
    var mission=dock.querySelector('.stageMini');mission.setAttribute('role','button');mission.tabIndex=0;mission.setAttribute('aria-label','选择模式与关卡');mission.onclick=function(){options.open('stage');};mission.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();options.open('stage');}};
    dock.querySelectorAll('.charCard').forEach(function(b){b.setAttribute('aria-label',b.textContent.trim());b.setAttribute('aria-pressed',b.classList.contains('selected')?'true':'false');});
  }
  global.SakurayoCommand={inbox:inbox,claimSupply:claimSupply,mount:mount,panel:panel,close:close};
})(window);

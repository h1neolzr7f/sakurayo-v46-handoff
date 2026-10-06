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
  var panelCharacter = '';
  var selectedMail = 'welcome';
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
    button{cursor:pointer}button:focus-visible{outline:2px solid #83e4f2;outline-offset:3px}button:disabled{cursor:default}
    .cmdMailbox48{display:grid;grid-template-columns:minmax(210px,31%) 1fr;gap:20px}.cmdMailList48{display:grid;align-content:start;gap:7px}.cmdMailList48 button{position:relative;min-height:65px;padding:12px 14px;border:1px solid var(--cmd-line);background:#1c2b39;color:#e8f0f5;text-align:left;font-size:12px}.cmdMailList48 button small{display:block;color:var(--cmd-dim);font-size:9px;margin-top:6px}.cmdMailList48 button.on{border-color:#8ce1ef;background:#244556}.cmdMailList48 button.unread:before{content:'';position:absolute;right:8px;top:8px;width:6px;height:6px;background:#efb26c;transform:rotate(45deg)}
    .cmdMailLetter48{min-height:320px;padding:30px;background:linear-gradient(135deg,#ffffff08,transparent),#172631;border:1px solid var(--cmd-line)}.cmdMailLetter48>small{font-size:10px;letter-spacing:.15em;color:var(--cmd-pink)}.cmdMailLetter48 h3{font-size:24px;font-weight:550;margin:18px 0}.cmdMailLetter48 p{font-size:13px;color:#cbdce6;line-height:1.9;max-width:650px}.cmdMailAttachment48{display:flex;align-items:center;gap:13px;margin:28px 0;padding:15px;border:1px solid var(--cmd-line);max-width:260px;background:#90d9eb0a}.cmdMailAttachment48 svg{width:35px;height:35px;color:var(--cmd-gold)}.cmdMailAttachment48 b{font-size:18px}.cmdMailAttachment48 small{display:block;font-size:10px;color:var(--cmd-dim);margin-top:4px}
    .cmdLogin48{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin:26px 0}.cmdLoginDay48{min-height:140px;padding:15px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#1b2c3a;border:1px solid var(--cmd-line)}.cmdLoginDay48 small{font-size:10px;letter-spacing:.1em;color:var(--cmd-dim)}.cmdLoginDay48 svg{width:30px;height:30px;color:var(--cmd-gold)}.cmdLoginDay48 b{font-size:21px;font-weight:550}.cmdLoginDay48 span{font-size:10px;color:#b7cddd}.cmdLoginDay48.on{border-color:#90e8fd;background:#204454}.cmdLoginDay48.done{opacity:.55}.cmdLoginDay48.done span{color:#9dedce}
    .cmdNotice48{max-width:850px;padding:24px;margin-bottom:15px;border:1px solid var(--cmd-line);border-left:2px solid #8ce1ef;background:#182a37}.cmdNotice48 small{font-size:9px;letter-spacing:.15em;color:var(--cmd-pink)}.cmdNotice48 h3{margin:12px 0;font-size:22px;font-weight:500}.cmdNotice48 p{font-size:13px;color:#cbdce6;line-height:1.8}.cmdActions47 button:disabled{background:#263847!important;color:#8ea4b3!important;border-color:var(--cmd-line)!important}
    @media(max-width:640px){.cmdMailbox48{grid-template-columns:1fr}.cmdMailList48{max-height:190px;overflow:auto}.cmdMailLetter48{min-height:280px;padding:20px}.cmdLogin48{grid-template-columns:repeat(2,1fr)}.cmdLoginDay48{min-height:110px}.cmdLoginDay48:last-child{grid-column:1/-1}}
    .drawer:not(.wishDrawer46){background:radial-gradient(ellipse at 15% 0,#22324b70,transparent 50%),#0a1020!important;color:var(--cmd-paper)}
    .drawer>.dhead{border-color:var(--cmd-line)!important;background:none!important}
    .drawer>.dhead h2{color:var(--cmd-paper)!important;text-shadow:none!important;font-size:20px;font-weight:600;letter-spacing:.13em!important}
    .drawer .close{border-radius:3px!important;border-color:var(--cmd-line)!important;background:#1b263bcc!important;min-width:40px;min-height:40px}
    #archiveDrawer .archiveDock46 button{border-radius:4px;border-color:var(--cmd-line);position:relative;padding:24px;min-height:220px}
    #archiveDrawer .archiveDock46 button b{font-weight:600;font-size:20px}
    #archiveDrawer .archiveDock46 button small{color:#c1cada}
    #stageList .stageCard{border-radius:4px;border-color:var(--cmd-line);box-shadow:none}
    #stageList .stageCard .i{padding-top:90px}
    #stageList .stageCard button,.modeBar46 button.on{background:#8ce1ef!important;color:#252638!important;border-radius:3px!important;border-color:#c7f4fa!important;box-shadow:none}
    #stageList .modeBar46{grid-column:1/-1;margin-bottom:4px}
    .modeBar46 button{min-height:56px;border-radius:3px;background:#152038;border-color:var(--cmd-line);font-weight:600}
    .modeBar46 button small,.modeBar46 button.on small{color:inherit}
    #shopDrawer .skinCard,#shopDrawer .shopItem40,#shopWallet44,#shopDrawer .shopTabs40,#shopDrawer .shopTabs40 button{border-radius:4px;border-color:var(--cmd-line);background:#131e32;box-shadow:none}
    #shopDrawer .shopTabs40 button.on{background:#8ce1ef;color:#252638;border-color:#c7f4fa}
    #shopDrawer .skinPreview{border-radius:0;background-color:#152339}
    #shopDrawer .skinCard>button,#shopDrawer .shopItem40 button,#shopDrawer .shopUpgrade40{min-height:40px;border-radius:3px!important;background:#8ce1ef!important;color:#252638!important;border-color:#c7f4fa!important}
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
    .cmdTabs47 button.on{background:#8ce1ef;color:#252638;border-color:#c7f4fa}
    .cmdTags47{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.cmdTags47 span{padding:5px 10px;border:1px solid var(--cmd-line);font-size:10px;color:#cee0eb}
    .cmdLoadout47{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}
    .cmdLoadout47>div{background:#141e32;border:1px solid var(--cmd-line);padding:12px;min-width:0;border-radius:3px}
    .cmdLoadout47 small{display:block;font-size:9px;color:#899ab5;letter-spacing:.12em;margin-bottom:6px}.cmdLoadout47 b{font-size:12px;font-weight:600}
    .cmdActions47{display:flex;gap:9px;margin:14px 0;flex-wrap:wrap}.cmdActions47 button{min-height:42px;padding:10px 22px;border-radius:3px;background:#19253b;border:1px solid var(--cmd-line);font-size:12px}
    .cmdActions47 button.primary47,.cmdSupply47 button{background:#8ce1ef;color:#252638;border:1px solid #c7f4fa}
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
    @media(max-width:640px){.cmdSplit47{grid-template-columns:1fr;gap:12px}.cmdPortrait47{min-height:200px}.cmdPortrait47>img{height:240px}.cmdSupplies47{grid-template-columns:1fr}.cmdSupply47{grid-template-columns:32px 1fr auto;padding:12px;gap:8px}.cmdRun47{grid-template-columns:58px 1fr;gap:10px}.cmdRun47>span{grid-column:2}#archiveDrawer .archiveDock46{grid-template-columns:1fr 1fr!important;min-height:0!important}}
    @keyframes commandEnter47{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
    #commandDrawer47:not(.hidden) #commandBody47{animation:commandEnter47 .22s ease-out both}
    .commandLinks47 button,.commandRail47 button,.cmdActions47 button,.cmdTabs47 button{transition:background-color .15s,border-color .15s}
    @media(hover:hover){.commandLinks47 button:hover,.commandRail47 button:hover,.cmdActions47 button:hover{border-color:#83e4f2;background-color:#25324a}.cmdTabs47 button:hover{border-color:#83e4f2}}
    @media(prefers-reduced-motion:reduce){.heroLiveSway46,.heroLiveBreath46,#commandBody47{animation:none!important}.heroLivePhys46,.heroLiveLook46,.commandLinks47 button,.commandRail47 button,.cmdActions47 button,.cmdTabs47 button{transition:none!important}}
  `;
  function style(){
    var d=global.document,node=d.getElementById('sakurayo-command-css');
    if(!node){node=d.createElement('style');node.id='sakurayo-command-css';node.textContent=CSS+(global.SakurayoTerminal?global.SakurayoTerminal.css:"");}
    var lobby=d.getElementById('sakurayo-lobby-css');
    if(!node.parentNode||(lobby&&(node.compareDocumentPosition(lobby)&4)))d.head.appendChild(node);
  }
  function bind(selector,fn){var n=global.document.querySelector(selector);if(n&&!n.commandBound47){n.onclick=fn;n.commandBound47=true;}}
  function loadout(model){
    return '<div class="cmdLoadout47">'+[['当前衣装',model.skin],['初始核心',model.starter],['武器道具',model.item],['排除符',model.talismans],['寻访时装',model.fashion],['寻访武器',model.weapon]].map(function(p){return '<div><small>'+p[0]+'</small><b>'+esc(p[1])+'</b></div>';}).join('')+'</div>';
  }
  function close(){
    var drawer=global.document.getElementById('commandDrawer47');
    options.ui.close(drawer);
    currentPanel='';
  }
  // The panel body is rebuilt to display current game data. One delegated handler
  // survives those rebuilds instead of rebinding every generated button.
  function action(e){
    var b=e.target.closest('button');if(!b||b.disabled)return;
    var model=options.model(),S=global.SakurayoServices,result;
    if(b.dataset.character){panelCharacter=b.dataset.character;panel('character',true);return;}
    if(b.dataset.supply){b.disabled=true;options.claim(b.dataset.supply);panel('supplies',true);return;}
    if(b.dataset.mail){selectedMail=b.dataset.mail;panel('mail',true);return;}
    if(b.dataset.operation){options.chooseMode(b.dataset.operation);return;}
    var rooms={commandWardrobe47:'shop',commandTalent47:'talent',commandStage47:'stage',commandLoadout47:'shop',commandCards47:'roster'};
    if(rooms[b.id]){options.open(rooms[b.id]);return;}
    if(b.id==='commandSelect47'){options.selectCharacter(panelCharacter||model.character.id);panel('character',true);}
    else if(b.id==='commandRole47')panel('character');
    else if(b.id==='commandLaunch47'){close();options.start();}
    else if(b.id==='commandNoticeActivity48')panel('activities');
    else if(b.id==='commandMailClaim48'||b.id==='commandMailAll48'){
      result=b.id==='commandMailClaim48'?S.claimMail(model.save,selectedMail,global.SakurayoCommand):S.claimAll(model.save,global.SakurayoCommand);
      if(result.ok){options.persist();options.notify(b.id==='commandMailClaim48'?'邮件补给已领取 · 樱花币 +'+result.reward:'已领取 '+result.count+' 份邮件 · 樱花币 +'+result.reward);}
      panel('mail',true);
    }else if(b.id==='commandLoginClaim48'){
      result=S.claimLogin(model.save);if(result.ok){options.persist();options.notify('签到完成 · 樱花币 +'+result.reward);}panel('login',true);
    }
  }
  function panel(kind,refresh){
    if(!options)return;
    var focused=global.document.activeElement;
    var focusId=refresh&&focused?focused.id:'';
    var focusCharacter=refresh&&focused&&focused.dataset?focused.dataset.character:'';
    if(!refresh)panelCharacter=options.model().character.id;
    currentPanel=kind;
    var d=global.document,drawer=d.getElementById('commandDrawer47');
    if(!drawer){
      drawer=d.createElement('section');drawer.id='commandDrawer47';drawer.className='drawer hidden';
      drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-labelledby','commandTitle47');
      drawer.innerHTML='<div class="dhead"><div><small id="commandEyebrow47"></small><h2 id="commandTitle47"></h2></div><button class="close" type="button" aria-label="返回大厅">×</button></div><div id="commandBody47"></div>';
      d.body.appendChild(drawer);drawer.querySelector('.close').onclick=close;
      d.getElementById('commandBody47').onclick=action;
    }
    var model=options.model(),titles={character:['OPERATOR FILE','作战角色'],prepare:['SORTIE PREPARATION','出击整备'],supplies:['RECOVERY TASKS','任务补给'],history:['COMBAT RECORD','近期战绩'],mail:['DISPATCH INBOX','邮箱'],login:['SEVEN DAY SUPPLY','七日登录签到'],notice:['BUREAU BULLETIN','公告'],activities:['FIELD OPERATIONS','活动与行动']};
    if(!titles[kind])return;
    d.getElementById('commandEyebrow47').textContent=titles[kind][0];
    d.getElementById('commandTitle47').textContent=titles[kind][1];
    var body=d.getElementById('commandBody47');
    if(kind==='character'){
      var c=model.characters.filter(function(x){return x.id===panelCharacter;})[0]||model.character;
      var active=c.id===model.character.id;
      body.innerHTML='<div class="cmdSplit47"><div class="cmdPortrait47"><img src="'+esc(options.art('characters/'+c.id+'/default/live_idle.webp'))+'" alt="'+esc(c.name)+'"><small>SAKURAYO / '+esc(c.id.toUpperCase())+'</small></div><div class="cmdSheet47"><div class="cmdTabs47">'+model.characters.map(function(x){return '<button data-character="'+esc(x.id)+'" class="'+(x.id===c.id?'on':'')+'">'+esc(x.name)+'</button>';}).join('')+'</div><h3>'+esc(c.name)+'</h3><div class="cmdRole47">'+esc(c.role)+' / '+esc(c.weapon)+'</div><p>'+esc(c.desc)+'</p><div class="cmdNotes47">'+esc(c.bonus)+'</div><div class="cmdTags47">'+c.schools.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>'+ (active?loadout(model):'<p>选择为出击角色后可查看当前装备。</p>')+'<div class="cmdActions47"><button class="primary47" id="commandSelect47">'+(active?'当前出击角色':'选择出击')+'</button><button id="commandWardrobe47">衣装与装备</button><button id="commandTalent47">永久天赋</button></div></div></div>';
    }else if(kind==='prepare'){
      var m=model.mission;
      body.innerHTML='<div class="cmdSplit47"><div><div class="cmdMission47" style="background-image:linear-gradient(0deg,#080e1cf5,#080e1c20),url(&quot;'+esc(m.art)+'&quot;)"><small>'+esc(model.mode)+'</small><h3>'+esc(m.name)+'</h3><p>'+esc(m.boss)+' · 预计 '+esc(m.minutes)+' 分钟</p><p style="margin-top:8px;color:#ead4a1">'+esc(model.tactic)+'</p></div><div class="cmdActions47"><button id="commandStage47">更换模式 / 关卡</button></div><div class="cmdNotes47">'+esc(model.modeId==='testimony'?'证词模式：跟随剧情，不发放随机升级卡，也不部署干员。':'肉鸽战斗：自动攻击，移动避险；升级三选一构筑职业，局内完成转职、融合与三相飞升。')+'</div></div><div class="cmdSheet47"><div class="cmdRole47">当前出击角色</div><h3>'+esc(model.character.name)+'</h3><p>'+esc(model.character.weapon)+' · '+esc(model.character.role)+'</p>'+loadout(model)+'<div class="cmdActions47"><button id="commandLoadout47">调整装备</button><button id="commandCards47">寻访装备</button><button id="commandRole47">切换角色</button><button class="primary47" id="commandLaunch47">开始出击 →</button></div><p>移动：摇杆 / WASD　冲刺：Shift　主动：空格 / 技能按钮<br>另外两名角色可在肉鸽模式使用 DP 部署支援。</p></div></div>';
    }else if(kind==='supplies'){
      body.innerHTML='<p class="cmdNotes47">战斗与章节回收留下的补给。每份仅领取一次，完成记录保存在本机。</p><div class="cmdSupplies47">'+inbox(model.save).map(function(r){return '<article class="cmdSupply47"><span>'+ (r.claimed?'✓':r.ready?'✦':'◇')+'</span><div><b>'+esc(r.title)+'</b><p>'+esc(r.desc)+'</p><small>樱花币 +'+r.reward+'</small></div><button data-supply="'+r.id+'" '+(r.claimed||!r.ready?'disabled':'')+'>'+ (r.claimed?'已领取':r.ready?'领取':'待完成')+'</button></article>';}).join('')+'</div>';
    }else if(kind==='mail'){
      var S=global.SakurayoServices,letters=S.mailbox(model.save,global.SakurayoCommand);
      var letter=letters.filter(function(m){return m.id===selectedMail;})[0]||letters[0];selectedMail=letter.id;
      if(!letter.read){S.markRead(model.save,letter.id,global.SakurayoCommand);options.persist();letters=S.mailbox(model.save,global.SakurayoCommand);letter=letters.filter(function(m){return m.id===selectedMail;})[0];}
      var canClaim=letters.some(function(m){return !m.claimed;});
      body.innerHTML='<div class="cmdMailbox48"><div class="cmdMailList48">'+letters.map(function(m){return '<button type="button" id="mail48-'+m.id+'" data-mail="'+m.id+'" class="'+(m.id===selectedMail?'on ':'')+(m.read?'':'unread')+'"><b>'+esc(m.title)+'</b><small>'+esc(m.sender)+' / '+(m.claimed?'已领取':m.read?'已读 · 待领取':'未读')+'</small></button>';}).join('')+'</div><article class="cmdMailLetter48"><small>DISPATCH / '+esc(letter.id.toUpperCase())+'</small><h3>'+esc(letter.title)+'</h3><p>发件人：'+esc(letter.sender)+'</p><p>'+esc(letter.desc)+'</p><p>这份补给存放在你的本机档案中。任务与邮件共用领取记录。</p><div class="cmdMailAttachment48">'+global.SakurayoTerminal.icon('supplies')+'<div><b>'+letter.reward+'</b><small>樱花币</small></div></div><div class="cmdActions47"><button class="primary47" id="commandMailClaim48" '+(letter.claimed?'disabled':'')+'>'+(letter.claimed?'附件已领取':'领取附件')+'</button><button id="commandMailAll48" '+(canClaim?'':'disabled')+'>一键领取</button></div></article></div>';
    }else if(kind==='login'){
      var status=global.SakurayoServices.loginStatus(model.save),label=status.reason==='complete'?'七日补给已全部领取':status.reason==='clock'?'请检查本机日期':status.reason==='claimed'?'今日已签到':'签到领取 · 樱花币 +'+status.reward;
      body.innerHTML='<article class="cmdNotice48"><small>WELCOME BACK / '+esc(status.today)+'</small><h3>每一次归来，都有新的补给。</h3><p>累计七个登录日，无需连续签到。本机日期每日最多领取一次；七日完成后不重复循环。已完成 '+status.count+' / 7 天。</p></article><div class="cmdLogin48">'+status.rewards.map(function(reward,i){return '<article class="cmdLoginDay48 '+(i<status.count?'done':i===status.count?'on':'')+'"><small>DAY '+(i+1)+'</small>'+global.SakurayoTerminal.icon('supplies')+'<b>'+reward+'</b><span>'+(i<status.count?'已领取':i===status.count?'本次补给':'待签到')+'</span></article>';}).join('')+'</div><div class="cmdActions47"><button class="primary47" id="commandLoginClaim48" '+(status.ready?'':'disabled')+'>'+label+'</button></div>';
    }else if(kind==='notice'){
      body.innerHTML='<article class="cmdNotice48"><small>UPDATE / DEVELOPMENT BUILD</small><h3>4.6.0 · 行动终端更新</h3><p>新大厅加入邮箱、七日登录签到、任务补给与活动入口。邮件与任务共享领取状态，进度保存在本机。四章插画和场景动画已更新。</p><p>当前为开发预发布版本；新 Android 安装包尚未发布。</p></article><article class="cmdNotice48"><small>FIELD MANUAL</small><h3>关于这场回收行动</h3><p>三名作战角色，四章战场。回收演习保留职业、转职、融合与三相飞升的肉鸽构筑；证词模式侧重剧情；主神空间提供高难轮回挑战。</p><p>寻访、装备、剧情档案与历史战绩均可从大厅进入。导出存档请前往设置。</p></article><div class="cmdActions47"><button id="commandNoticeActivity48">查看活动与行动</button></div>';
    }else if(kind==='activities'){
      body.innerHTML='<div class="cmdActivities48">'+[['story','回收行动 · 四章演习','三名角色出击，收集随机升级并组合职业、转职与融合。'],['testimony','证词回收 · 剧情档案','沿着四章剧情完成证词回收。此模式不发放随机升级卡。'],['mainGod','主神空间 · 高难轮回','进入独立的主神试炼与兑换界面，解锁条件沿用现有游戏规则。']].map(function(a){return '<article class="cmdNotice48 cmdActivity48" style="background-image:linear-gradient(90deg,#102332e6,#10233299),url(&quot;'+esc(options.art('ui/tactical/activity-'+(a[0]==='mainGod'?'maingod':a[0])+'-v3.webp'))+'&quot;)"><small>LOCAL OPERATION / '+a[0].toUpperCase()+'</small><h3>'+a[1]+'</h3><p>'+a[2]+'</p><div class="cmdActions47"><button data-operation="'+a[0]+'">进入行动 →</button></div></article>';}).join('')+'</div>';
    }else{
      body.innerHTML=model.history.length?'<div class="cmdHistory47">'+model.history.slice(0,12).map(function(r){return '<article class="cmdRun47"><b>'+esc(r.win?'回收成功':'战斗结束')+'</b><div><strong>'+esc(r.character)+' · '+esc(r.stage)+'</strong><p>'+esc(r.mode)+' / Lv.'+esc(r.level)+' / '+esc(r.kills)+' 击破 / '+esc(r.duration)+'</p></div><span>'+esc(r.date)+'</span></article>';}).join('')+'</div>':'<div class="cmdEmpty47">暂无战绩。完成第一次出击后，回收记录会显示在这里。</div>';
    }
    var next=focusId&&d.getElementById(focusId);
    if(focusCharacter)next=Array.from(body.querySelectorAll('[data-character]')).find(function(b){return b.dataset.character===focusCharacter;});
    if(!refresh||!next||next.disabled)next=drawer.querySelector('.close');
    options.ui.open(drawer,{initialFocus:next,onClose:function(){currentPanel='';}});
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
    }
    var m=options.model(),unread=inbox(m.save).filter(function(r){return r.ready&&!r.claimed;}).length;
    if(global.SakurayoTerminal)global.SakurayoTerminal.decorate(root,dock,options,m);
    if(!global.SakurayoTerminal)d.getElementById('commandProgress47').textContent='四章回收 '+m.completed+' / 4 · '+m.mode;
    d.getElementById('commandUnread47').textContent=unread?String(unread):'';
    bind('#commandCharacter47',function(){panel('character');});
    bind('#commandSupplies47',function(){panel('supplies');});
    bind('#commandSettings47',function(){options.settings();});
    bind('#commandPrepare47',function(){panel('prepare');});
    bind('#commandHistory47',function(){panel('history');});
    if(global.SakurayoServices){
      d.getElementById('commandMailUnread48').textContent=global.SakurayoServices.mailbox(m.save,global.SakurayoCommand).filter(function(row){return !row.read;}).length||'';
      d.getElementById('commandLoginReady48').textContent=global.SakurayoServices.loginStatus(m.save).ready?'!':'';
      bind('#commandMail48',function(){panel('mail');});bind('#commandNotice48',function(){panel('notice');});bind('#commandLogin48',function(){panel('login');});bind('#commandActivity48',function(){panel('activities');});
    }
    var mission=dock.querySelector('.stageMini');mission.setAttribute('role','button');mission.tabIndex=0;mission.setAttribute('aria-label','选择模式与关卡');mission.onclick=function(){options.open('stage');};mission.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();options.open('stage');}};
    dock.querySelectorAll('.charCard').forEach(function(b){b.setAttribute('aria-label',b.textContent.trim());b.setAttribute('aria-pressed',b.classList.contains('selected')?'true':'false');});
  }
  function settingsUtilities(actions){
    var d=global.document,body=d.getElementById('settingsBody37');if(!body)return;
    var section=d.getElementById('commandUtilities48');if(!section){section=d.createElement('section');section.id='commandUtilities48';section.className='cmdNotice48';body.appendChild(section);}
    section.innerHTML='<small>LOCAL UTILITIES</small><h3>存档与帮助</h3><div class="cmdActions47">'+actions.map(function(a){return '<button type="button" id="'+esc(a.id)+'">'+esc(a.label)+'</button>';}).join('')+'</div>';
    actions.forEach(function(a){bind('#'+a.id,a.open);});
  }
  global.SakurayoCommand={inbox:inbox,claimSupply:claimSupply,mount:mount,panel:panel,close:close,settingsUtilities:settingsUtilities};
})(window);

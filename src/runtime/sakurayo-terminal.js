(function(global){
 'use strict';
 var PATHS={
  operator:'<path d="M21 4h22l9 11-5 19-10 7-13-7-5-13zM23 40l13 8 13-8 12 20H9z"/>',
  equipment:'<path d="M15 5l8 2 4 9-5 5 28 28 5-5 7 7-11 11-7-7 5-5-28-28-5 5-9-4-2-8 8 4 7-7z"/><path d="M47 7l9-2-5 10 4 4 10-5-2 9-11 4-27 30-8-8 30-27z"/>',
  combat:'<path d="M32 2l8 20 22 10-22 10-8 20-8-20L2 32l22-10zM32 18l-7 14 7 14 7-14z" fill-rule="evenodd"/>',
  gacha:'<path d="M32 3l7 20 22 9-22 9-7 20-7-20-22-9 22-9zM32 21l-11 11 11 11 11-11z" fill-rule="evenodd"/>',
  roster:'<path d="M9 15l23-9 23 9v34l-23 10L9 49zm8 5v24l12 6V26zm19 6v24l12-6V20zM21 16l11 5 11-5-11-4z" fill-rule="evenodd"/>',
  shop:'<path d="M4 8h10l8 32h31l8-24H21l2 8h27l-3 8H28L20 8z"/><circle cx="29" cy="52" r="6"/><circle cx="49" cy="52" r="6"/>',
  stage:'<path d="M32 5l28 51H4zm0 16L18 47h28z" fill-rule="evenodd"/><path d="M32 30l7 13H25z"/>',
  archive:'<path d="M14 5h33l9 9v40H14zm8 9v32h26V19l-5-5z" fill-rule="evenodd"/><path d="M26 24h17v4H26zm0 10h17v4H26zM5 17h5v43h34v4H5z"/>',
  records:'<path d="M8 37h9v22H8zm15-14h9v36h-9zm15-16h9v52h-9zm15 39h7v13h-7z"/>',
  mail:'<path d="M6 13h52v38H6zm6 6l20 16 20-16zM12 27v18h40V27L32 42z" fill-rule="evenodd"/>',
  notice:'<path d="M12 6h29l12 12v41H12zm8 8v37h25V23H36v-9z" fill-rule="evenodd"/><path d="M24 28h17v4H24zm0 9h17v4H24z"/>',
  settings:'<path d="M25 5h14l2 9 8 5 9-2 6 12-7 6-1 9 5 7-10 10-8-4-9 2-5 7-12-6 1-9-5-8-9-2V27l9-2 5-8-2-9zM32 22a11 11 0 100 22 11 11 0 000-22z" fill-rule="evenodd"/>',
  supplies:'<path d="M5 16l27-9 27 9v36l-27 9-27-9zm8 6v24l15 5V27zm23 5v24l15-5V22z" fill-rule="evenodd"/><path d="M25 3h14v10H25zm0 29h14v5H25z"/>',
  login:'<path d="M9 12h46v47H9zm8 10v29h30V22z" fill-rule="evenodd"/><path d="M16 3h6v15h-6zm26 0h6v15h-6zM22 29h8v7h-8zm14 0h8v7h-8zM22 41h8v7h-8zm14 0h8v7h-8z"/>',
  logo:'<path d="M32 4l7 13-7 14-7-14zM20 25l8 14-15 24H2zm24 0l18 38H51L36 39zM26 45h12l8 14H18z"/>'
 };
 function icon(name){return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="currentColor">'+(PATHS[name]||PATHS.combat)+'</svg>';}
 function label(name,text,en){return '<span class="terminalIcon48">'+icon(name)+'</span><span class="terminalLabel48"><b>'+text+'</b><small>'+en+'</small></span>';}
 var CSS=`
 :root{--cmd-ink:#101920;--cmd-paper:#f0f5f8;--cmd-dim:#b3c5cf;--cmd-line:#d5e9f338;--cmd-pink:#71e0f4;--cmd-gold:#f1d08d}
 #gachaDrawer.wishDrawer46{background:#142432}#gachaDrawer .wishStage46{background:#243a49}
 #gachaDrawer .wishStage46:before{background:linear-gradient(90deg,#172a3a15,transparent 48%,#152b4133)}
 #gachaDrawer .wishTitle46 h3{color:#fff;text-shadow:0 2px 12px #19344b,0 0 24px #82e6f540}#gachaDrawer .wishTitle46 p{color:#dcf5fc}
 #gachaDrawer .wishTabs46 button,#gachaDrawer .wishPills46 b,#gachaDrawer .wishSpark46 button{border-radius:3px;border-color:#d3eef250;background:#14283adb;color:#e5f4f9}
 #gachaDrawer .wishTabs46 button{min-height:40px}#gachaDrawer .wishTabs46 button.on{background:linear-gradient(120deg,#b7eef6,#83d5e5);color:#173443;border-color:#c9f5ff}
 #gachaDrawer .wishPity46{background:#162c3ee6;border-color:#c5e8f33d;border-radius:4px}#gachaDrawer .pityRow46 span{color:#d7f1f7}
 #gachaDrawer .pityRail46{background:#d1f0f029;box-shadow:none}#gachaDrawer .pityRail46 i{background:linear-gradient(90deg,#69bfda,#b4f5ff);box-shadow:0 0 9px #8ce6f44d}
 #gachaDrawer .pityRow46.sr .pityRail46 i{background:linear-gradient(90deg,#9aadc9,#d1dff3)}#gachaDrawer .wishDock46{background:linear-gradient(180deg,#10233300,#102333e8 34%,#102333)}
 #gachaDrawer #gachaPull1{background:linear-gradient(120deg,#37627b,#234c65);border-color:#a6e2f363;color:#f4fcff;border-radius:4px}#gachaDrawer #gachaPull10{background:linear-gradient(120deg,#b7eef6,#83d5e5);border-color:#c9f5ff;color:#173443;border-radius:4px}
 #gachaDrawer .wishPetals46 i{background:#e6edf480;box-shadow:0 0 7px #c4f5ff40}#gachaDrawer>.dhead .close{width:40px;height:40px;border-radius:3px;border-color:#c6edf451;background:#162c3edd}
 .cmdActivities48{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.cmdActivities48 .cmdActivity48{margin:0;min-width:0;padding:20px;min-height:320px}.cmdActivities48 .cmdActions47{margin-top:auto;padding-top:12px}.cmdActivities48 h3{font-size:22px}.cmdActivities48 p{flex:1}@media(max-width:640px){.cmdActivities48{grid-template-columns:1fr}.cmdActivities48 .cmdActivity48{min-height:210px}}
 .cmdActivity48{min-height:180px;display:flex;flex-direction:column;justify-content:flex-end;background-size:cover;background-position:center;border-left:2px solid #8ce1ef!important}.cmdActivity48 p{max-width:640px;color:#ecf5f8!important}.cmdActivity48 h3,.cmdActivity48 small{text-shadow:0 2px 7px #0b1b28}
 #menu.homeDock46.terminalLobby48{isolation:isolate}html.landscape46 #menu.homeDock46.terminalLobby48 .bg{inset:0;filter:none!important;background-position:center!important}
 #menu.homeDock46.terminalLobby48 .bg:after{background:linear-gradient(90deg,#0a11174d,transparent 47%,#14253325),linear-gradient(0deg,#111a25a0,transparent 45%,#10192238)!important}
 html.landscape46 #menu.homeDock46.terminalLobby48 .menu{position:absolute;inset:0;display:block;width:100%;max-width:none;height:100%;margin:0;padding:0;border:0;border-radius:0;background:none;box-shadow:none;overflow:visible;pointer-events:none;transform:none}
 html.landscape46 #menu.homeDock46.terminalLobby48 #coverTitle36{top:4%;left:3%;max-width:42%;padding-left:42px;text-shadow:0 2px 10px #07111c80}
 #menu.homeDock46.terminalLobby48 #coverTitle36 b{font-size:clamp(20px,2.8vw,36px)!important;letter-spacing:.1em!important;background:none;color:#fff;font-weight:650}
 #menu.homeDock46.terminalLobby48 #coverTitle36 span{padding:3px 0;border:0;border-radius:0;background:none;font-size:8px;letter-spacing:.16em;color:#d8e8ee}
 .terminalLogo48{position:absolute;left:0;top:0;width:32px;height:44px;color:#f2e4ed;pointer-events:none}.terminalLogo48 svg{width:100%;height:100%}
 html.landscape46 #menu.homeDock46.terminalLobby48 .heroLive46{width:68%;top:0;bottom:0;mask-image:linear-gradient(90deg,#000 0%,#000 88%,transparent);-webkit-mask-image:linear-gradient(90deg,#000 0%,#000 88%,transparent)}
 html.landscape46 #menu.homeDock46.terminalLobby48 .heroLiveBreath46{width:60vw;height:98%;margin-left:0}.heroLiveBreath46 img{object-position:center bottom!important}
 html.landscape46 #menu.homeDock46.terminalLobby48 .heroLiveName46{top:auto;bottom:31%;left:4.4%;max-width:48%;padding:5px 13px;border-left:2px solid #b9eaf4;background:linear-gradient(90deg,#0e1b2580,transparent);text-shadow:0 2px 8px #0c1520}
 #menu.homeDock46.terminalLobby48 .heroLiveName46 b{font-size:clamp(21px,2.7vw,35px);letter-spacing:.14em;font-weight:600}#menu.homeDock46.terminalLobby48 .heroLiveName46 small{font-size:10px;letter-spacing:.12em;color:#e7eff4}
 #menu.homeDock46.terminalLobby48 .menu>.top{position:absolute;top:4%;left:auto;right:3%;display:flex;align-items:center;gap:8px;width:auto;max-width:53%;padding:0;margin:0;background:none;border:0;min-height:40px;pointer-events:auto}
 #menu.homeDock46.terminalLobby48 .menuBrand35,#menu.homeDock46.terminalLobby48 .profile,#menu.homeDock46.terminalLobby48 .utilityButtons37{display:none!important}
 #menu.homeDock46.terminalLobby48 .coins{display:flex;align-items:center;gap:8px;min-height:40px;padding:0 13px;margin:0;border:1px solid #e8f4ff50!important;border-radius:0!important;background:#1a2b3f80!important;color:#fff;font-size:15px;font-weight:500;white-space:nowrap}
 #menu.homeDock46.terminalLobby48 .coins svg{width:21px;height:21px;color:#91e3f4}
 .terminalTop48{display:flex;gap:8px}.terminalTop48 button{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;height:40px;min-width:66px;padding:0 10px;border:1px solid #e8f4ff38;border-radius:0;background:#1a2b3f80;color:#fff;font-size:12px}
 .terminalTop48 svg{width:19px;height:19px}.terminalTop48 i,.terminalSupport48 i{position:absolute;right:0;top:-5px;min-width:13px;height:15px;padding:1px 3px;background:#eb9553;color:#151e25;font:600 10px/13px system-ui;font-style:normal;clip-path:polygon(15% 0,100% 0,100% 85%,85% 100%,0 100%,0 15%)}
 .terminalTop48 i:empty,.terminalSupport48 i:empty{display:none}
 .commandHeading47{position:absolute;top:18%;left:3%;width:23%;padding:0 0 8px 12px;border:0;border-left:2px solid #b7e9f0;z-index:4;background:linear-gradient(90deg,#0d1b2680,transparent);pointer-events:none}
 .commandHeading47 picture{display:none}.commandHeading47 small{font-size:8px;letter-spacing:.17em;color:#d4e7ec}.commandHeading47 b{font-size:17px;letter-spacing:.1em;margin:4px 0;display:block;color:#fff}.commandHeading47 p{margin:5px 0;color:#dae8ee;font-size:11px}
 .tacticalDeck48{position:absolute;right:3%;top:27%;bottom:23%;width:25%;max-width:330px;display:grid;grid-template-rows:minmax(56px,1fr) minmax(56px,1fr) minmax(74px,1.35fr) 40px;gap:14px;pointer-events:auto}
 .tacticalDeck48>button{display:flex;align-items:center;gap:15px;position:relative;width:100%;min-width:0;padding:8px 18px;border:0;border-bottom:1px solid #d8f0f340;border-radius:0;background:linear-gradient(90deg,#20334900,#20334950 20%,#20334965);color:#fff;text-align:left;text-shadow:0 2px 6px #111e2a70;box-shadow:none}
 .tacticalDeck48>#commandPrepare47{margin-left:7%;width:93%}.terminalIcon48{display:grid;place-items:center;flex:0 0 auto;width:52px;height:52px;margin:0!important;background:none!important}.terminalIcon48 svg{width:100%;height:100%;filter:drop-shadow(0 2px 5px #0b203445)}
 .terminalLabel48{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-width:0}.terminalLabel48 b{font-size:clamp(17px,2.2vw,28px);letter-spacing:.08em;font-weight:600;white-space:nowrap}.terminalLabel48 small{font-size:8px;letter-spacing:.16em;color:#cde6ef}
 .tacticalDeck48>button:after{content:'›';margin-left:auto;font-size:30px;font-weight:300;color:#def8ff}
 html.landscape46 #menu.homeDock46.terminalLobby48 .start{width:100%;min-height:74px;margin:0;padding:8px 18px;font-size:25px;letter-spacing:.2em;border:0;border-left:2px solid #85eeff;border-radius:0;background:linear-gradient(100deg,#54cbe924,#236c976d)!important;color:#fff!important;text-shadow:0 2px 6px #18384b;box-shadow:none}
 #menu.homeDock46.terminalLobby48 .start .terminalIcon48{width:72px;height:72px;color:#92eaff}#menu.homeDock46.terminalLobby48 .start .terminalLabel48 b{font-size:clamp(25px,3.2vw,42px)}
 html.landscape46 #menu.homeDock46.terminalLobby48 .stageMini{position:relative;width:100%;min-height:40px;margin:0;padding:5px 8px;display:grid;grid-template-columns:1fr auto;gap:6px;border:0;border-bottom:2px solid #65dced;border-radius:0;background:#1c30487d;backdrop-filter:none;cursor:pointer}
 #menu.homeDock46.terminalLobby48 .stageMini img,#menu.homeDock46.terminalLobby48 .stageMini p{display:none}#menu.homeDock46.terminalLobby48 .stageMini h3{font-size:12px;line-height:1.4;color:#e8f5fa;font-weight:500}#menu.homeDock46.terminalLobby48 .stageMini strong{font-size:13px;color:#a9ecff;font-weight:500}
 html.landscape46 #menu.homeDock46.terminalLobby48 .homeNav46{position:absolute;bottom:4.5%;right:3%;display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;width:51%;max-width:740px;padding:0;margin:0;border:0;border-radius:0;background:none;gap:3px;pointer-events:auto;z-index:6}
 #menu.homeDock46.terminalLobby48 .homeNav46 button{position:relative;min-height:66px;min-width:0;padding:4px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;border-right:1px solid #d5e8f13b;border-radius:0;background:linear-gradient(0deg,#1427388a,transparent);color:#fff;font-weight:500;font-size:12px;letter-spacing:.05em;text-shadow:0 2px 5px #101e2e;box-shadow:none}
 #menu.homeDock46.terminalLobby48 .homeNav46 .terminalLabel48{display:flex;width:auto!important;height:auto!important;margin:0!important;background:none!important;border-radius:0}
 #menu.homeDock46.terminalLobby48 .homeNav46 button:last-child{border-right:0}#menu.homeDock46.terminalLobby48 .homeNav46 .terminalIcon48{width:30px;height:30px}#menu.homeDock46.terminalLobby48 .homeNav46 .terminalLabel48{align-items:center;gap:1px}#menu.homeDock46.terminalLobby48 .homeNav46 b{font-size:12px;font-weight:500}#menu.homeDock46.terminalLobby48 .homeNav46 small{font-size:6px;letter-spacing:.1em}
 .commandLinks47,.commandRail47{display:none!important}
 .terminalActivity48{position:absolute;left:3%;bottom:17%;width:31%;max-width:370px;min-height:76px;display:flex;flex-direction:column;justify-content:center;gap:5px;padding:10px 15px;border:1px solid #d1e6f56b;border-left:2px solid #7dddec;border-radius:0;background-position:center;background-size:cover;color:#fff;text-align:left;text-shadow:0 1px 5px #102036;pointer-events:auto;z-index:6}
 .terminalActivity48 small{font-size:8px;letter-spacing:.15em}.terminalActivity48 b{font-size:15px;font-weight:550;letter-spacing:.04em}.terminalActivity48:after{content:'›';position:absolute;right:10px;top:24px;font-size:25px}
 html.landscape46 #menu.homeDock46.terminalLobby48 .charSelectPanel{position:absolute!important;top:auto!important;left:3%!important;right:auto!important;bottom:5%!important;width:17%;max-width:200px;margin:0!important;padding:0;border:0;background:none;box-shadow:none;z-index:6}
 html.landscape46 #menu.homeDock46.terminalLobby48 .characterList{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
 html.landscape46 #menu.homeDock46.terminalLobby48 .charCard{position:relative;width:100%;max-width:none!important;min-width:40px;height:57px!important;padding:2px!important;border:1px solid #ddedf470;border-radius:0;background:#18253980;overflow:hidden;box-shadow:none}
 html.landscape46 #menu.homeDock46.terminalLobby48 .charCard img{width:100%!important;height:100%!important;object-fit:cover;object-position:center 16%;border:0;border-radius:0;background:transparent}
 html.landscape46 #menu.homeDock46.terminalLobby48 .charCard.selected{border-color:#90e8fd;box-shadow:inset 0 -3px #90e8fd,0 0 12px #6ed0ee40;background:#2b566a80}
 #menu.homeDock46.terminalLobby48 .charCard b,#menu.homeDock46.terminalLobby48 .charCard em,#menu.homeDock46.terminalLobby48 .charCard p,#menu.homeDock46.terminalLobby48 .charCard .selectedMark{display:none!important}
 .terminalSupport48{position:absolute;bottom:5%;left:22%;width:17%;max-width:210px;display:flex;gap:7px;pointer-events:auto;z-index:6}.terminalSupport48 button{position:relative;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;min-height:57px;min-width:40px;padding:3px;border:1px solid #dae9f24f;border-radius:0;background:#1d304480;color:#fff;font-size:10px;white-space:nowrap}.terminalSupport48 svg{width:25px;height:25px}
 .commandSignal47{position:absolute;right:3%;bottom:1%;left:auto;z-index:6;display:flex;align-items:center;gap:6px;color:#a6efff;font-size:8px;letter-spacing:.08em;pointer-events:none}.commandSignal47:before{content:'';width:5px;height:5px;background:#7ce8f2;transform:rotate(45deg)}
 #menu button:focus-visible,#menu .stageMini:focus-visible{outline:2px solid #9cefff;outline-offset:3px}
 @media(hover:hover){.tacticalDeck48>button:hover,.terminalTop48 button:hover,.terminalSupport48 button:hover,#menu.homeDock46.terminalLobby48 .homeNav46 button:hover{background-color:#54bfdb30;border-color:#92eafb}.terminalActivity48:hover{border-color:#92eafb}}
 @media(max-height:520px) and (min-width:641px){
 html.landscape46 #menu.homeDock46.terminalLobby48 #coverTitle36{top:4%;padding-left:31px}#menu.homeDock46.terminalLobby48 #coverTitle36 b{font-size:22px!important}.terminalLogo48{width:24px;height:30px}#menu.homeDock46.terminalLobby48 #coverTitle36 span{font-size:6px}
 .commandHeading47{top:23%;width:24%;padding-left:8px}.commandHeading47 b{font-size:13px}.commandHeading47 small{font-size:6px}.commandHeading47 p{font-size:9px}
 .tacticalDeck48{top:23%;bottom:22%;width:28%;gap:6px;grid-template-rows:minmax(40px,1fr) minmax(40px,1fr) minmax(52px,1.25fr) 40px}.tacticalDeck48>button{padding:3px 9px;gap:8px}.terminalIcon48{width:32px;height:32px}.terminalLabel48 b{font-size:18px}.terminalLabel48 small{font-size:6px}
 html.landscape46 #menu.homeDock46.terminalLobby48 .start{min-height:52px;padding:3px 9px}#menu.homeDock46.terminalLobby48 .start .terminalIcon48{width:45px;height:45px}#menu.homeDock46.terminalLobby48 .start .terminalLabel48 b{font-size:27px}
 .terminalTop48 button{min-width:55px;font-size:10px;padding:0 7px}.terminalTop48{gap:5px}#menu.homeDock46.terminalLobby48 .coins{font-size:12px;padding:0 8px}
 .terminalActivity48{min-height:57px;padding:6px 11px;gap:3px;bottom:19%;width:33%}.terminalActivity48 b{font-size:12px}.terminalActivity48 small{font-size:6px}.terminalActivity48:after{top:12px}
 html.landscape46 #menu.homeDock46.terminalLobby48 .heroLiveName46{bottom:36%;left:4.4%;padding:3px 9px}#menu.homeDock46.terminalLobby48 .heroLiveName46 b{font-size:22px}#menu.homeDock46.terminalLobby48 .heroLiveName46 small{font-size:8px}
 html.landscape46 #menu.homeDock46.terminalLobby48 .charCard{height:45px!important}html.landscape46 #menu.homeDock46.terminalLobby48 .charSelectPanel{bottom:5.5%!important;width:19%;max-width:180px}.terminalSupport48{bottom:5.5%;left:24%;width:17%}.terminalSupport48 button{min-height:45px;font-size:8px}.terminalSupport48 svg{width:19px;height:19px}
 #menu.homeDock46.terminalLobby48 .homeNav46 button{min-height:48px}#menu.homeDock46.terminalLobby48 .homeNav46 .terminalIcon48{width:22px;height:22px}#menu.homeDock46.terminalLobby48 .homeNav46 b{font-size:10px}#menu.homeDock46.terminalLobby48 .homeNav46 small{display:none}
 }
 @media(max-width:640px){
 html.landscape46 #menu.homeDock46.terminalLobby48 #coverTitle36{top:3%;left:3%;padding-left:0;max-width:40%}#menu.homeDock46.terminalLobby48 #coverTitle36 b{font-size:21px!important}#menu.homeDock46.terminalLobby48 #coverTitle36 span{font-size:6px;letter-spacing:0}.terminalLogo48{display:none}
 #menu.homeDock46.terminalLobby48 .menu>.top{top:3%;max-width:53%;gap:4px}.terminalTop48{gap:4px}.terminalTop48 button{min-width:40px;width:40px;padding:0}.terminalTop48 button span{display:none}.terminalTop48 svg{width:18px;height:18px}#menu.homeDock46.terminalLobby48 .coins{min-width:40px;padding:0 5px;font-size:11px;gap:3px}#menu.homeDock46.terminalLobby48 .coins svg{width:14px;height:14px}
 .commandHeading47{top:14%;width:37%}.commandHeading47 small{font-size:6px}.commandHeading47 b{font-size:14px}.commandHeading47 p{font-size:9px}
 html.landscape46 #menu.homeDock46.terminalLobby48 .heroLive46{width:76%}html.landscape46 #menu.homeDock46.terminalLobby48 .heroLiveBreath46{width:135vw;margin-left:-27vw;height:90%}html.landscape46 #menu.homeDock46.terminalLobby48 .heroLiveBreath46 img{object-position:center top!important}
 html.landscape46 #menu.homeDock46.terminalLobby48 .heroLiveName46{left:4%;bottom:35%;max-width:75%;padding:5px 7px}#menu.homeDock46.terminalLobby48 .heroLiveName46 b{font-size:24px}#menu.homeDock46.terminalLobby48 .heroLiveName46 small{font-size:8px}
 .tacticalDeck48{right:3%;width:40%;top:33%;bottom:28%;gap:14px;grid-template-rows:minmax(50px,1fr) minmax(50px,1fr) minmax(72px,1.3fr) 40px}.tacticalDeck48>button{padding:6px 8px;gap:7px}.terminalIcon48{width:30px;height:30px}.terminalLabel48 b{font-size:17px}.terminalLabel48 small{font-size:6px}.tacticalDeck48>button:after{font-size:20px}
 html.landscape46 #menu.homeDock46.terminalLobby48 .start{min-height:72px;padding:6px 8px}#menu.homeDock46.terminalLobby48 .start .terminalIcon48{width:40px;height:40px}#menu.homeDock46.terminalLobby48 .start .terminalLabel48 b{font-size:25px}#menu.homeDock46.terminalLobby48 .stageMini h3{font-size:10px}#menu.homeDock46.terminalLobby48 .stageMini strong{font-size:10px}
 .terminalActivity48{left:3%;width:50%;min-height:67px;bottom:24%;padding:8px 10px}.terminalActivity48 b{font-size:12px}.terminalActivity48 small{font-size:7px}
 html.landscape46 #menu.homeDock46.terminalLobby48 .charSelectPanel{left:3%!important;bottom:16%!important;width:41%;max-width:none}html.landscape46 #menu.homeDock46.terminalLobby48 .charCard{height:54px!important}
 .terminalSupport48{left:3%;bottom:9%;width:41%;max-width:none}.terminalSupport48 button{min-height:49px;font-size:10px}.terminalSupport48 svg{width:21px;height:21px}
 html.landscape46 #menu.homeDock46.terminalLobby48 .homeNav46{width:92%;right:4%;bottom:1.5%;max-width:none}#menu.homeDock46.terminalLobby48 .homeNav46 button{min-height:56px}#menu.homeDock46.terminalLobby48 .homeNav46 .terminalIcon48{width:23px;height:23px}#menu.homeDock46.terminalLobby48 .homeNav46 b{font-size:10px}#menu.homeDock46.terminalLobby48 .homeNav46 small{display:none}.commandSignal47{bottom:9.5%;font-size:7px}
 }
 @media(prefers-reduced-motion:reduce){.tacticalDeck48,.terminalActivity48{animation:none!important}}
 `;
 function decorate(root,dock,opts,model){
  root.classList.add('terminalLobby48');
  var d=global.document,deck=d.getElementById('tacticalDeck48');
  if(!deck){
   deck=d.createElement('div');deck.id='tacticalDeck48';deck.className='tacticalDeck48';dock.appendChild(deck);
   deck.appendChild(d.getElementById('commandCharacter47'));deck.appendChild(d.getElementById('commandPrepare47'));deck.appendChild(d.getElementById('start'));deck.appendChild(dock.querySelector('.stageMini'));
   var nav=dock.querySelector('.homeNav46');nav.appendChild(d.getElementById('commandHistory47'));
   var bar=d.createElement('div');bar.className='terminalTop48';bar.innerHTML='<button id="commandMail48" type="button" aria-label="邮箱">'+icon('mail')+'<span>邮箱</span><i id="commandMailUnread48"></i></button><button id="commandNotice48" type="button" aria-label="公告">'+icon('notice')+'<span>公告</span></button>';bar.appendChild(d.getElementById('commandSettings47'));dock.querySelector('.top').appendChild(bar);
   var support=d.createElement('div');support.className='terminalSupport48';support.appendChild(d.getElementById('commandSupplies47'));support.insertAdjacentHTML('beforeend','<button id="commandLogin48" type="button">'+icon('login')+'签到<i id="commandLoginReady48"></i></button>');root.appendChild(support);
   var activity=d.createElement('button');activity.id='commandActivity48';activity.className='terminalActivity48';activity.type='button';activity.setAttribute('aria-label','活动与行动入口');activity.innerHTML='<small>活动 / 行动简报　ACTIVITY</small><b id="commandActivityName48"></b>';root.appendChild(activity);
   root.appendChild(d.getElementById('commandHeading47'));root.appendChild(dock.querySelector('.charSelectPanel'));

  }
  var title=d.getElementById('coverTitle36');if(title&&!title.querySelector('.terminalLogo48')){var logo=d.createElement('div');logo.className='terminalLogo48';logo.innerHTML=icon('logo');title.appendChild(logo);}
  // Legacy menu refresh also rewrites nav art. Decorate the real existing buttons afterwards.
  var navLabels={gacha:['寻访','HEADHUNT'],roster:['仓库','DEPOT'],shop:['采购','STORE'],stage:['关卡','MISSIONS'],archive:['档案','ARCHIVES']};
  dock.querySelectorAll('.homeNav46 [data-open]').forEach(function(b){var key=b.dataset.open,row=navLabels[key];if(row)b.innerHTML=label(key,row[0],row[1]);});
  root.querySelectorAll('.charCard[data-character]').forEach(function(b){
   var id=b.dataset.character,img=b.querySelector('img');if(!img||img.dataset.terminalPortrait===id)return;
   img.dataset.terminalPortrait=id;img.onerror=function(){this.onerror=null;this.src=opts.art('characters/'+id+'/default/portrait.webp');};
   img.src=opts.art('ui/tactical/portrait-'+id+'-v3.webp');
  });
  d.getElementById('commandHistory47').innerHTML=label('records','战绩','RECORDS');
  d.getElementById('commandCharacter47').innerHTML=label('operator','干员','OPERATORS');
  d.getElementById('commandPrepare47').innerHTML=label('equipment','装备整备','EQUIPMENT');
  d.getElementById('start').innerHTML=label('combat','出击','OPERATION');
  d.getElementById('commandSettings47').innerHTML=icon('settings')+'<span>设置</span>';d.getElementById('commandSettings47').setAttribute('aria-label','设置');
  d.getElementById('commandSupplies47').innerHTML=icon('supplies')+'任务补给<i id="commandUnread47"></i>';
  var coins=dock.querySelector('.coins');coins.innerHTML=icon('gacha')+'<span id="coins">'+String(Math.max(0,Number(model.save.coins)||0))+'</span>';coins.setAttribute('aria-label','樱花币 '+String(model.save.coins||0));
  d.getElementById('commandActivityName48').textContent=model.mode+' · '+model.mission.name;
  var activityArt=opts.art('ui/tactical/activity-'+(model.modeId==='mainGod'?'maingod':model.modeId==='testimony'?'testimony':'story')+'-v3.webp');
  d.getElementById('commandActivity48').style.backgroundImage='linear-gradient(90deg,#14283dbb,#14283d30),url("'+activityArt+'")';
  d.getElementById('commandHeading47').querySelector('b').textContent='回收行动局';
  d.getElementById('commandProgress47').textContent='章节 '+model.completed+'/4 · 作战 '+(Number(model.save.runs)||0);
  d.getElementById('commandSignal47').textContent='离线作战就绪 / OFFLINE MODE';
 }
 global.SakurayoTerminal={css:CSS,icon:icon,decorate:decorate};
})(window);

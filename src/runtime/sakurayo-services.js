(function(global){
  'use strict';
  // Offline finite rewards. Presentation belongs to the command room.
  // 内测福利邮件（0.9.0-beta）。mailbox() 每次按 ID 生成，旧存档打开即收到；领取记录按 ID 存，不会重复发放。
  var BETA_MAILS=[
    {id:'beta_welcome',title:'内测欢迎信',desc:'指挥官，欢迎参加《樱夜尸潮》内测。本版本的抽卡、衣橱、形态与夜行都已开放，这里先送上一份见面礼。',items:{coins:3000,tickets:10}},
    {id:'beta_supply',title:'内测补给 · 足量物资',desc:'为了让你充分体验寻访、衣橱与形态解锁，行动局拨付了一批内测专用物资。数值仅供测试，正式版会重置。',items:{coins:60000,tickets:40,kyo:900}},
    {id:'beta_login',title:'每日登录累积奖励（内测）',desc:'内测期间登录即可领取累积奖励，七日签到照常进行，与本邮件不冲突。',items:{coins:8000,tickets:10,kyo:200}},
    {id:'beta_patch',title:'版本 0.9.0-beta 更新公告',desc:'横屏锁定、寻访立绘头部安全区、看板娘去闪烁、新手教学左右分栏、割草镜头按屏高自适应与 60fps 默认画质、中式科技风道具替换。详见公告。',items:{coins:5000,kyo:300}},
    {id:'beta_feedback',title:'问题反馈感谢信',desc:'感谢你在实机上反馈的问题（立绘被裁、看板娘闪烁、弹窗需要滚动、割草角色过大等），它们已在本版本修复。这是一点心意。',items:{coins:10000,tickets:20,kyo:400}}
  ];
  var BETA_IDS=BETA_MAILS.map(function(m){return m.id;});
  var MAIL_IDS=['welcome','firstRun','chapter1','chapter2','chapter3','chapter4','kills500'].concat(BETA_IDS);
  var LOGIN_REWARDS=[60,80,100,120,140,160,240];
  function validDay(s){
    if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
    var parts=s.split('-').map(Number),d=new Date(s+'T12:00:00Z');
    return Number.isFinite(d.getTime())&&d.getUTCFullYear()===parts[0]&&d.getUTCMonth()+1===parts[1]&&d.getUTCDate()===parts[2];
  }
  function normalize(raw){
    var r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    var read={};MAIL_IDS.forEach(function(id){read[id]=!!(r.mailRead&&r.mailRead[id]===true);});
    var dates=[];(Array.isArray(r.loginDates)?r.loginDates:[]).forEach(function(day){if(validDay(day)&&dates.indexOf(day)<0)dates.push(day);});
    var beta={};BETA_IDS.forEach(function(id){beta[id]=!!(r.betaClaimed&&r.betaClaimed[id]===true);});
    return {mailRead:read,welcomeClaimed:r.welcomeClaimed===true,betaClaimed:beta,loginDates:dates.sort().slice(0,7)};
  }
  function state(save){return normalize(save&&save.shop40&&save.shop40.ops&&save.shop40.ops.services);}
  function write(save,value){
    if(!save.shop40||typeof save.shop40!=='object'||Array.isArray(save.shop40))save.shop40={};
    if(!save.shop40.ops||typeof save.shop40.ops!=='object'||Array.isArray(save.shop40.ops))save.shop40.ops={};
    save.shop40.ops.services=value;
  }
  function credit(save,reward){var coins=Number(save.coins);save.coins=(Number.isFinite(coins)?Math.max(0,coins):0)+reward;}
  // 附件发放：樱花币 → save.coins；寻访券 → save.wishTickets46（寻访优先消耗券）；镜屑 → 衣橱 cosmetics46.kyo
  function grant(save,items){
    if(items.coins)credit(save,items.coins);
    if(items.tickets)save.wishTickets46=Math.max(0,Number(save.wishTickets46)||0)+items.tickets;
    if(items.kyo){if(!save.cosmetics46||typeof save.cosmetics46!=='object')save.cosmetics46=global.SakurayoWardrobe?global.SakurayoWardrobe.blank():{owned:[],equip:{form:{},weapon:{},fx:null},kyo:0,kyoWeek:0,kyoGot:0,formUses:{}};save.cosmetics46.kyo=Math.min(9999,(Number(save.cosmetics46.kyo)||0)+items.kyo);}
  }
  function mailbox(save,command){
    var s=state(save),rows=[{id:'welcome',title:'行动终端接入补给',desc:'欢迎回到樱夜行动局。整备你的装备，从灵枢观外街开始回收行动。',reward:200,claimed:s.welcomeClaimed}];
    BETA_MAILS.forEach(function(m){rows.push({id:m.id,title:m.title,desc:m.desc,reward:m.items.coins||0,items:m.items,claimed:s.betaClaimed[m.id]});});
    if(command)command.inbox(save).filter(function(r){return r.ready;}).forEach(function(r){rows.push({id:r.id,title:r.title,desc:r.desc+' 补给已送达，可在邮箱或任务中领取。',reward:r.reward,claimed:r.claimed});});
    return rows.map(function(r){r.read=s.mailRead[r.id]===true;r.sender='樱夜行动局';return r;});
  }
  function markRead(save,id,command){
    if(!mailbox(save,command).some(function(m){return m.id===id;}))return false;
    var s=state(save);s.mailRead[id]=true;write(save,s);return true;
  }
  function claimMail(save,id,command){
    var mail=mailbox(save,command).filter(function(m){return m.id===id;})[0];
    if(!mail)return {ok:false,reason:'unknown',reward:0};
    if(mail.claimed)return {ok:false,reason:'claimed',reward:0};
    var result;
    var beta=BETA_MAILS.filter(function(m){return m.id===id;})[0];
    if(beta){var b=state(save);b.betaClaimed[id]=true;write(save,b);grant(save,beta.items);result={ok:true,reason:'',reward:beta.items.coins||0,items:beta.items};}
    else if(id==='welcome'){var s=state(save);s.welcomeClaimed=true;write(save,s);credit(save,200);result={ok:true,reason:'',reward:200};}
    else result=command.claimSupply(save,id);
    if(result.ok)markRead(save,id,command);
    return result;
  }
  function claimAll(save,command){
    var reward=0,count=0;
    mailbox(save,command).filter(function(m){return !m.claimed;}).forEach(function(m){var r=claimMail(save,m.id,command);if(r.ok){reward+=r.reward;count++;}});
    return {ok:count>0,reason:count?'':'empty',reward:reward,count:count};
  }
  function dayKey(date){
    var d=date||new Date();if(!d||typeof d.getTime!=='function'||!Number.isFinite(d.getTime()))return '';
    return String(d.getFullYear()).padStart(4,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function loginStatus(save,date){
    var dates=state(save).loginDates,today=dayKey(date),last=dates[dates.length-1]||'';
    var reason=!validDay(today)?'clock':dates.length>=7?'complete':today===last?'claimed':today<last?'clock':'';
    return {count:dates.length,today:today,ready:!reason,reason:reason,reward:LOGIN_REWARDS[dates.length]||0,rewards:LOGIN_REWARDS.slice()};
  }
  function claimLogin(save,date){
    var status=loginStatus(save,date);if(!status.ready)return {ok:false,reason:status.reason,reward:0};
    var s=state(save);s.loginDates.push(status.today);write(save,s);credit(save,status.reward);
    return {ok:true,reason:'',reward:status.reward};
  }
  global.SakurayoServices={BETA_MAILS:BETA_MAILS,grant:grant,normalize:normalize,mailbox:mailbox,markRead:markRead,claimMail:claimMail,claimAll:claimAll,loginStatus:loginStatus,claimLogin:claimLogin};
})(window);

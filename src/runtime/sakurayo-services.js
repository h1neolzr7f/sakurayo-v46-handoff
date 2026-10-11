(function(global){
  'use strict';
  // Offline finite rewards. Presentation belongs to the command room.
  var MAIL_IDS=['welcome','firstRun','chapter1','chapter2','chapter3','chapter4','kills500'];
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
    return {mailRead:read,welcomeClaimed:r.welcomeClaimed===true,loginDates:dates.sort().slice(0,7)};
  }
  function state(save){return normalize(save&&save.shop40&&save.shop40.ops&&save.shop40.ops.services);}
  function write(save,value){
    if(!save.shop40||typeof save.shop40!=='object'||Array.isArray(save.shop40))save.shop40={};
    if(!save.shop40.ops||typeof save.shop40.ops!=='object'||Array.isArray(save.shop40.ops))save.shop40.ops={};
    save.shop40.ops.services=value;
  }
  function credit(save,reward){var coins=Number(save.coins);save.coins=(Number.isFinite(coins)?Math.max(0,coins):0)+reward;}
  function mailbox(save,command){
    var s=state(save),rows=[{id:'welcome',title:'行动终端接入补给',desc:'欢迎回到樱夜行动局。整备你的装备，从神社外街开始回收行动。',reward:200,claimed:s.welcomeClaimed}];
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
    if(id==='welcome'){var s=state(save);s.welcomeClaimed=true;write(save,s);credit(save,200);result={ok:true,reason:'',reward:200};}
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
  global.SakurayoServices={normalize:normalize,mailbox:mailbox,markRead:markRead,claimMail:claimMail,claimAll:claimAll,loginStatus:loginStatus,claimLogin:claimLogin};
})(window);

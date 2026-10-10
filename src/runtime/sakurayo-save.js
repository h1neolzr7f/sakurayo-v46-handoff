(function (global) {
  'use strict';
  // Pure save boundary shared by startup and text import. No storage or UI effects.
  var CATALOG = global.SakurayoCatalog;
  var SETTINGS = {master:.8,sfx:.8,music:.45,vibration:1,fx:1,hudSize:'standard',damageText:'compact',contrast:1,uiCalm:1,glow:'off',glowVersion:2,mascot:'follow'};
  var MAIN_GOD = {points:0,unlockedTier:1,bestTier:0,clears:0,runs:0,deepest:0,contracts:{},challenges:{},power:0,vitality:0,tempo:0,resonance:0,fortune:0,regenBlood:0,psiLink:0,gunBlade:0,mageCircuit:0,summonPage:0,spaceRing:0,rebirthDoll:0,sideKey:0,cursedHeart:0};
  var SHOP = {starter:{assault:0,bastion:0,flow:0,arcane:0},equippedStarter:null,items:{bait:0,ammo:0,whetstone:0,mirror:0},equippedWeapon:null,baitEquipped:false,ownedTalismans:[],bannedSchools:[],noUpgradeChallenge:false,lastTab:'skins',ops:{pity:0,pitySR:0,pulls:0,tenPulls:0,owned:{},last:[],cheatUsed:0}};
  var DEFAULTS = {coins:0,unlock:1,done:[],kills:0,bosses:0,best:0,runs:0,tal:{atk:0,hp:0,luck:0,mag:0,flow:0},ach:{},claim:{},story:[0],forms:[],fusions:[],endings:[],runHistory:[],banter:1,tutorialDone:false,settings:SETTINGS,character:'sayo',skin:'default',ownedSkins:['default'],mainGod:MAIN_GOD,storyChoices38:{sayo:{},aya:{},rion:{}},storySeen38:{},shop40:SHOP,balance40:{samples:[],betaSessions:0},hiddenStory40:{},pendingLoneStory40:null,extensions:{}};
  // Lifetime counters have no gameplay cap; keep earned values within safe integer precision.
  var COUNT_MAX = Number.MAX_SAFE_INTEGER || 9007199254740991;
  var SCHOOLS = ['mech','gun','alch','gene','vamp','spore','magical','cult','mage','shrine','summon','ninja','idol','necro'];
  function object(value) {return !!value && typeof value === 'object' && !Array.isArray(value);}
  function forbidden(key) {return key === '__proto__' || key === 'constructor' || key === 'prototype';}
  function copy(value) {
    if (Array.isArray(value)) return value.map(copy);
    if (!object(value)) return value;
    var result = {};
    Object.keys(value).forEach(function (key) {if (!forbidden(key)) result[key] = copy(value[key]);});
    return result;
  }
  function merge(defaults, raw) {
    var out = copy(defaults);
    if (!object(raw)) return out;
    Object.keys(raw).forEach(function (key) {
      if (forbidden(key)) return;
      out[key] = object(defaults[key]) ? merge(defaults[key],raw[key]) : copy(raw[key]);
    });
    return out;
  }
  function number(value, min, max, fallback) {
    var n = Number(value);
    return Math.max(min,Math.min(max,Number.isFinite(n) ? n : fallback));
  }
  function integer(value,min,max,fallback) {return Math.floor(number(value,min,max,fallback));}
  function list(raw) {return Array.isArray(raw) ? raw : [];}
  function flag(value, fallback) {return value === 0 || value === false ? 0 : value === 1 || value === true ? 1 : fallback;}
  function settings(raw) {
    var s = merge(SETTINGS,raw);
    ['master','sfx','music'].forEach(function (key) {s[key] = number(s[key],0,1,SETTINGS[key]);});
    ['vibration','fx','contrast','uiCalm'].forEach(function (key) {s[key] = flag(s[key],SETTINGS[key]);});
    s.hudSize = ['standard','compact'].indexOf(s.hudSize) >= 0 ? s.hudSize : 'standard';
    s.mascot = ['follow','sayo','aya','rion'].indexOf(s.mascot) >= 0 ? s.mascot : 'follow';
    s.damageText = ['off','compact','full'].indexOf(s.damageText) >= 0 ? s.damageText : 'compact';
    // Version 2 deliberately removed the old always-on glow default.
    s.glow = number(object(raw) ? raw.glowVersion : 0,0,999,0) >= 2 && ['off','soft','vivid'].indexOf(s.glow) >= 0 ? s.glow : 'off';
    s.glowVersion = 2;
    return s;
  }
  function normalize(raw, options) {
    options = options || {};
    if (options.strict && !object(raw)) throw new Error('存档根节点无效');
    if (options.strict && (!object(raw.tal) || !object(raw.mainGod))) throw new Error('缺少天赋或主神数据');
    var incoming = object(raw) ? raw : {}, clean = copy(DEFAULTS);
    Object.keys(DEFAULTS).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(incoming,key)) clean[key] = object(DEFAULTS[key]) ? merge(DEFAULTS[key],incoming[key]) : copy(incoming[key]);
    });
    clean.coins = integer(clean.coins,0,COUNT_MAX,0);
    clean.unlock = integer(clean.unlock,1,4,1);
    ['kills','bosses'].forEach(function (key) {clean[key] = integer(clean[key],0,COUNT_MAX,0);});
    clean.runs = integer(clean.runs,0,COUNT_MAX,0);clean.best = number(clean.best,0,COUNT_MAX,0);
    clean.done = list(clean.done).map(Number).filter(function (id,index,ids) {return [1,2,3,4].indexOf(id) >= 0 && ids.indexOf(id) === index;});
    clean.runHistory = list(clean.runHistory).filter(object).slice(0,30);
    ['story','forms','fusions','endings'].forEach(function (key) {if (!Array.isArray(clean[key])) clean[key] = copy(DEFAULTS[key]);});
    clean.character = ['sayo','aya','rion'].indexOf(clean.character) >= 0 ? clean.character : 'sayo';
    clean.ownedSkins = list(clean.ownedSkins).filter(function (id,index,ids) {return typeof id === 'string' && !forbidden(id) && ids.indexOf(id) === index && (!options.skins || options.skins.indexOf(id) >= 0);});
    if (clean.ownedSkins.indexOf('default') < 0) clean.ownedSkins.unshift('default');
    clean.skin = clean.ownedSkins.indexOf(clean.skin) >= 0 ? clean.skin : 'default';
    clean.settings = settings(incoming.settings);
    Object.keys(CATALOG.tal).forEach(function (key) {clean.tal[key] = CATALOG.level(clean.tal[key],CATALOG.tal[key]);});
    ['points','clears','runs','deepest'].forEach(function (key) {clean.mainGod[key] = integer(clean.mainGod[key],0,COUNT_MAX,0);});
    [CATALOG.mainGodUpgrades,CATALOG.mainGodItems].forEach(function (group) {Object.keys(group).forEach(function (key) {clean.mainGod[key] = CATALOG.level(clean.mainGod[key],group[key]);});});
    clean.mainGod.unlockedTier = integer(clean.mainGod.unlockedTier,1,4,1);
    clean.mainGod.bestTier = integer(clean.mainGod.bestTier,0,4,0);
    ['sayo','aya','rion'].forEach(function (id) {if (!object(clean.storyChoices38[id])) clean.storyChoices38[id] = {};});
    var shop = clean.shop40;
    Object.keys(SHOP.starter).forEach(function (id) {shop.starter[id] = CATALOG.level(shop.starter[id],CATALOG.starters[id]);});
    Object.keys(SHOP.items).forEach(function (id) {shop.items[id] = CATALOG.level(shop.items[id],CATALOG.items[id]);});
    if (!Object.prototype.hasOwnProperty.call(SHOP.starter,shop.equippedStarter)) shop.equippedStarter = null;
    if (['ammo','whetstone','mirror'].indexOf(shop.equippedWeapon) < 0 || !shop.items[shop.equippedWeapon]) shop.equippedWeapon = null;
    shop.ownedTalismans = list(shop.ownedTalismans).filter(function (id) {return SCHOOLS.indexOf(id) >= 0;});
    shop.bannedSchools = list(shop.bannedSchools).filter(function (id) {return shop.ownedTalismans.indexOf(id) >= 0;}).slice(0,2);
    if (['skins','starters','items','talismans','extensions'].indexOf(shop.lastTab) < 0) shop.lastTab = 'skins';
    // The lobby owns the evolving collection schema, including service receipts.
    if (options.normalizeOps) clean.shop40 = options.normalizeOps(shop);
    clean.balance40.samples = list(clean.balance40.samples).filter(object).slice(0,80);
    clean.balance40.betaSessions = integer(clean.balance40.betaSessions,0,COUNT_MAX,0);
    if (['sayo','aya','rion'].indexOf(clean.pendingLoneStory40) < 0) clean.pendingLoneStory40 = null;
    Object.keys(clean.extensions).forEach(function (id) {if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(id) || !object(clean.extensions[id])) delete clean.extensions[id];});
    return clean;
  }
  global.SakurayoSave = Object.freeze({normalize:normalize,defaults:function () {return copy(DEFAULTS);}});
})(window);

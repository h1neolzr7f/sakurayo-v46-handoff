(function (global) {
  "use strict";

  var API_VERSION = 2;
  var GAME_VERSION = String(global.SAKURAYO_GAME_VERSION || "4.6.6");
  var packs = [];
  var orderedPacks = [];
  var packById = Object.create(null);
  var listeners = Object.create(null);
  var hooks = Object.create(null);
  var errors = [];
  var api = null;
  var finalized = false;
  var ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,63}$/;
  var ENTRY_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,47}$/;
  var ASSET_PATH = /^content-packs\/[a-z0-9._-]+\/[a-zA-Z0-9._\/-]+$/;

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function mergeDefaults(defaults, value) {
    var output = isRecord(defaults) ? clone(defaults) : {};
    if (!isRecord(value)) return output;
    Object.keys(value).forEach(function (key) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") return;
      var incoming = value[key];
      if (isRecord(output[key]) && isRecord(incoming)) output[key] = mergeDefaults(output[key], incoming);
      else output[key] = clone(incoming);
    });
    return output;
  }

  function recordError(packId, phase, error) {
    var normalized = error instanceof Error ? error : new Error(String(error || "Unknown extension error"));
    var entry = {
      packId: packId || "unknown",
      phase: phase || "unknown",
      message: normalized.message,
      stack: normalized.stack || "",
      time: new Date().toISOString(),
    };
    errors.push(entry);
    if (errors.length > 80) errors.shift();
    if (global.__SAKURAYO_DEV__ && global.__SAKURAYO_DEV__.report) {
      global.__SAKURAYO_DEV__.report("extension:" + entry.phase, normalized, { source: entry.packId });
    } else if (global.console && console.error) {
      console.error("[Sakurayo extension]", entry.packId, entry.phase, normalized);
    }
    return entry;
  }

  function fail(owner, path, message) {
    throw new Error(owner + "." + path + " " + message);
  }

  function id(owner, path, value, packId) {
    var text = String(value || "");
    var pattern = packId ? ID_PATTERN : ENTRY_ID_PATTERN;
    if (!pattern.test(text)) fail(owner, path, "has an invalid id");
    return text;
  }

  function text(value, fallback) {
    return String(value === undefined || value === null ? (fallback || "") : value);
  }

  function finite(owner, path, value, options) {
    var number = Number(value);
    if (!Number.isFinite(number)) fail(owner, path, "must be a finite number");
    if (options && options.integer) number = Math.floor(number);
    if (options && options.min !== undefined && number < options.min) fail(owner, path, "is below minimum " + options.min);
    if (options && options.max !== undefined && number > options.max) fail(owner, path, "is above maximum " + options.max);
    return number;
  }

  function coordinate(owner, path, value) {
    return finite(owner, path, value, { min: 0, max: 1 });
  }

  function validateList(owner, path, value) {
    if (value === undefined) return [];
    if (!Array.isArray(value)) fail(owner, path, "must be an array");
    return value;
  }

  function uniqueIds(owner, path, entries) {
    var seen = Object.create(null);
    entries.forEach(function (entry, index) {
      if (seen[entry.id]) fail(owner, path + "[" + index + "].id", "duplicates " + entry.id);
      seen[entry.id] = true;
    });
    return seen;
  }

  function assetPath(owner, path, value, directoryAllowed) {
    var result = text(value);
    if (!ASSET_PATH.test(result) || result.indexOf("..") >= 0 || /^(?:https?:|data:|file:|\/)/i.test(result)) {
      fail(owner, path, "must be a local content-packs path");
    }
    if (!directoryAllowed && !/\.[a-z0-9]{2,5}$/i.test(result)) fail(owner, path, "must name a file");
    return result.replace(/\/{2,}/g, "/");
  }

  function normalizeAssetTree(owner, path, value) {
    if (!isRecord(value)) fail(owner, path, "must be an object");
    var output = {};
    Object.keys(value).forEach(function (key) {
      var next = value[key];
      output[key] = isRecord(next) ? normalizeAssetTree(owner, path + "." + key, next) : assetPath(owner, path + "." + key, next, false);
    });
    return output;
  }

  function normalizeCondition(owner, path, value) {
    if (value === undefined) return { type: "always" };
    if (!isRecord(value)) fail(owner, path, "must be an object");
    var allowed = ["always", "ownedSkin", "ownedItem", "flag", "stageComplete", "achievement"];
    var type = text(value.type);
    if (allowed.indexOf(type) < 0) fail(owner, path + ".type", "is unsupported");
    var output = clone(value);
    output.type = type;
    if (type === "ownedSkin") output.skinId = id(owner, path + ".skinId", value.skinId, false);
    if (type === "ownedItem") output.itemId = id(owner, path + ".itemId", value.itemId, false);
    if (type === "achievement") output.achievementId = id(owner, path + ".achievementId", value.achievementId, false);
    if (type === "flag") {
      output.flag = id(owner, path + ".flag", value.flag, false);
      if (value.value === undefined) fail(owner, path + ".value", "is required");
    }
    if (type === "stageComplete") output.stageId = finite(owner, path + ".stageId", value.stageId, { integer: true, min: 1 });
    return output;
  }

  function normalizeReward(owner, path, value) {
    if (!isRecord(value)) fail(owner, path, "must be an object");
    var type = text(value.type || (value.fragment || value.value ? "fragment" : "coins"));
    if (type !== "coins" && type !== "fragment") fail(owner, path + ".type", "must be coins or fragment");
    var output = { type: type };
    if (type === "coins") output.amount = finite(owner, path + ".amount", value.amount === undefined ? value.coins || 0 : value.amount, { integer: true, min: 0 });
    else {
      output.value = text(value.value || value.fragment || "未命名碎片");
      output.coins = finite(owner, path + ".coins", value.coins || 0, { integer: true, min: 0 });
    }
    return output;
  }

  function normalizeCostume(owner, value, index) {
    if (!isRecord(value)) fail(owner, "shop.costumes[" + index + "]", "must be an object");
    var path = "shop.costumes[" + index + "]";
    var costume = {
      id: id(owner, path + ".id", value.id, false), n: text(value.n || value.name || value.id), e: text(value.e || "🎀"),
      price: finite(owner, path + ".price", value.price || 0, { integer: true, min: 0 }), c1: text(value.c1 || "#8ce7ff"), c2: text(value.c2 || "#493b7a"),
      bias: validateList(owner, path + ".bias", value.bias).map(function (entry) { return text(entry); }), d: text(value.d || value.description)
    };
    if (value.assetBase) costume.assetBase = assetPath(owner, path + ".assetBase", value.assetBase, true);
    return costume;
  }

  function normalizeItem(owner, value, index) {
    if (!isRecord(value)) fail(owner, "shop.items[" + index + "]", "must be an object");
    var path = "shop.items[" + index + "]";
    return { id: id(owner, path + ".id", value.id, false), n: text(value.n || value.name || value.id), i: text(value.i || "📦"), d: text(value.d || value.description), price: finite(owner, path + ".price", value.price || 0, { integer: true, min: 0 }), max: finite(owner, path + ".max", value.max === undefined ? 1 : value.max, { integer: true, min: 1, max: 999 }) };
  }

  function normalizeAchievement(owner, value, index) {
    if (!isRecord(value)) fail(owner, "achievements[" + index + "]", "must be an object");
    var path = "achievements[" + index + "]";
    return { id: id(owner, path + ".id", value.id, false), n: text(value.n || value.name || value.id), i: text(value.i || "🧩"), d: text(value.d || value.description), r: finite(owner, path + ".r", value.r || 0, { integer: true, min: 0 }), condition: normalizeCondition(owner, path + ".condition", value.condition) };
  }

  function normalizeStory(owner, value, index) {
    if (!isRecord(value)) fail(owner, "stories[" + index + "]", "must be an object");
    var path = "stories[" + index + "]";
    return { id: id(owner, path + ".id", value.id, false), n: text(value.n || value.name || value.id), i: text(value.i || "📖"), d: text(value.d || value.description), unlock: normalizeCondition(owner, path + ".unlock", value.unlock) };
  }

  function normalizeZone(owner, path, zone) {
    if (!isRecord(zone)) fail(owner, path, "must be an object");
    var type = text(zone.type);
    if (type === "circle") return { type: type, x: coordinate(owner, path + ".x", zone.x), y: coordinate(owner, path + ".y", zone.y), r: finite(owner, path + ".r", zone.r === undefined ? zone.radius : zone.r, { min: 0.001, max: 2 }) };
    if (type === "rect") return { type: type, x: coordinate(owner, path + ".x", zone.x), y: coordinate(owner, path + ".y", zone.y), w: finite(owner, path + ".w", zone.w, { min: 0.001, max: 2 }), h: finite(owner, path + ".h", zone.h, { min: 0.001, max: 2 }) };
    if (type === "polygon") {
      var points = validateList(owner, path + ".points", zone.points);
      if (points.length < 3) fail(owner, path + ".points", "needs at least three points");
      return { type: type, points: points.map(function (point, index) { if (!Array.isArray(point) || point.length !== 2) fail(owner, path + ".points[" + index + "]", "must be [x,y]"); return [coordinate(owner, path + ".points[" + index + "][0]", point[0]), coordinate(owner, path + ".points[" + index + "][1]", point[1])]; }) };
    }
    fail(owner, path + ".type", "must be circle, rect or polygon");
  }

  function normalizeExploration(owner, value, index) {
    if (!isRecord(value)) fail(owner, "explorations[" + index + "]", "must be an object");
    var path = "explorations[" + index + "]";
    var scene = {
      id: id(owner, path + ".id", value.id, false), stageId: value.stageId === "mainGod" ? "mainGod" : finite(owner, path + ".stageId", value.stageId, { integer: true, min: 1 }), title: text(value.title || value.id), entryLabel: value.entryLabel ? text(value.entryLabel) : "",
      background: assetPath(owner, path + ".background", value.background, false),
      spawn: validateList(owner, path + ".spawn", value.spawn).map(function (entry, pointIndex) { return coordinate(owner, path + ".spawn[" + pointIndex + "]", entry); }),
      walkable: validateList(owner, path + ".walkable", value.walkable).map(function (zone, zoneIndex) { return normalizeZone(owner, path + ".walkable[" + zoneIndex + "]", zone); }),
      nodes: [], events: [],
    };
    if (scene.spawn.length !== 2) fail(owner, path + ".spawn", "must contain [x,y]");
    scene.nodes = validateList(owner, path + ".nodes", value.nodes).map(function (node, nodeIndex) {
      var nodePath = path + ".nodes[" + nodeIndex + "]";
      if (!isRecord(node)) fail(owner, nodePath, "must be an object");
      var output = { id: id(owner, nodePath + ".id", node.id, false), x: coordinate(owner, nodePath + ".x", node.x), y: coordinate(owner, nodePath + ".y", node.y), icon: text(node.icon || "✦"), label: text(node.label || node.id), reward: normalizeReward(owner, nodePath + ".reward", node.reward) };
      if (node.requiresEvent) output.requiresEvent = id(owner, nodePath + ".requiresEvent", node.requiresEvent, false);
      return output;
    });
    scene.events = validateList(owner, path + ".events", value.events).map(function (event, eventIndex) {
      var eventPath = path + ".events[" + eventIndex + "]";
      if (!isRecord(event)) fail(owner, eventPath, "must be an object");
      var eventId = id(owner, eventPath + ".id", event.id, false);
      var output = { id: eventId, x: coordinate(owner, eventPath + ".x", event.x), y: coordinate(owner, eventPath + ".y", event.y), icon: text(event.icon || "?"), title: text(event.title || eventId), text: text(event.text || event.body), choices: [] };
      if (event.requiresNode) output.requiresNode = id(owner, eventPath + ".requiresNode", event.requiresNode, false);
      output.choices = validateList(owner, eventPath + ".choices", event.choices).map(function (choice, choiceIndex) {
        var choicePath = eventPath + ".choices[" + choiceIndex + "]";
        if (!isRecord(choice)) fail(owner, choicePath, "must be an object");
        var choiceId = id(owner, choicePath + ".id", choice.id, false);
        var reward = isRecord(choice.reward) ? choice.reward : {};
        var coins = choice.coins;
        if (coins === undefined) coins = reward.type === "coins" ? reward.amount : reward.coins;
        var fragment = choice.fragment;
        if (!fragment && reward.type === "fragment") fragment = reward.value || reward.fragment || (eventId + ":" + choiceId);
        return { id: choiceId, label: text(choice.label || choiceId), description: text(choice.description || choice.result || "选择会写入本章探索记录。"), coins: finite(owner, choicePath + ".coins", coins || 0, { integer: true, min: 0 }), fragment: fragment ? text(fragment) : "" };
      });
      if (!output.choices.length) fail(owner, eventPath + ".choices", "must contain at least one choice");
      uniqueIds(owner, eventPath + ".choices", output.choices);
      return output;
    });
    var nodeIds = uniqueIds(owner, path + ".nodes", scene.nodes);
    var eventIds = uniqueIds(owner, path + ".events", scene.events);
    scene.nodes.forEach(function (node) { if (node.requiresEvent && !eventIds[node.requiresEvent]) fail(owner, path + ".nodes." + node.id + ".requiresEvent", "references a missing event"); });
    scene.events.forEach(function (event) { if (event.requiresNode && !nodeIds[event.requiresNode]) fail(owner, path + ".events." + event.id + ".requiresNode", "references a missing node"); });
    return scene;
  }

  function normalizeDependency(owner, value, index) {
    if (typeof value === "string") return { id: id(owner, "dependencies[" + index + "].id", value, true), minVersion: 1 };
    if (!isRecord(value)) fail(owner, "dependencies[" + index + "]", "must be a string or object");
    return { id: id(owner, "dependencies[" + index + "].id", value.id, true), minVersion: finite(owner, "dependencies[" + index + "].minVersion", value.minVersion === undefined ? 1 : value.minVersion, { integer: true, min: 1 }) };
  }

  function normalizePack(raw) {
    if (!isRecord(raw)) throw new Error("Content pack must be an object");
    var owner = id("pack", "id", raw.id, true);
    var version = finite(owner, "version", raw.version, { integer: true, min: 1 });
    var shop = isRecord(raw.shop) ? raw.shop : {};
    var game = isRecord(raw.game) ? raw.game : {};
    var pack = {
      id: owner, version: version, apiVersion: finite(owner, "apiVersion", raw.apiVersion === undefined ? 1 : raw.apiVersion, { integer: true, min: 1 }),
      title: text(raw.title || owner), description: text(raw.description), game: { min: text(game.min || "0.0.0"), maxExclusive: text(game.maxExclusive || "999.0.0") },
      dependencies: validateList(owner, "dependencies", raw.dependencies).map(function (entry, index) { return normalizeDependency(owner, entry, index); }),
      conflicts: validateList(owner, "conflicts", raw.conflicts).map(function (entry, index) { return id(owner, "conflicts[" + index + "]", entry, true); }),
      saveDefaults: isRecord(raw.saveDefaults) ? clone(raw.saveDefaults) : {}, migrations: validateList(owner, "migrations", raw.migrations).map(clone),
      assets: raw.assets === undefined ? {} : normalizeAssetTree(owner, "assets", raw.assets), texts: isRecord(raw.texts) ? clone(raw.texts) : {},
      costumes: validateList(owner, "shop.costumes", shop.costumes).map(function (entry, index) { return normalizeCostume(owner, entry, index); }),
      items: validateList(owner, "shop.items", shop.items).map(function (entry, index) { return normalizeItem(owner, entry, index); }),
      achievements: validateList(owner, "achievements", raw.achievements).map(function (entry, index) { return normalizeAchievement(owner, entry, index); }),
      stories: validateList(owner, "stories", raw.stories).map(function (entry, index) { return normalizeStory(owner, entry, index); }),
      explorations: validateList(owner, "explorations", raw.explorations).map(function (entry, index) { return normalizeExploration(owner, entry, index); }),
      enabled: true, disabledReason: "", order: packs.length,
    };
    uniqueIds(owner, "shop.costumes", pack.costumes); uniqueIds(owner, "shop.items", pack.items); uniqueIds(owner, "achievements", pack.achievements); uniqueIds(owner, "stories", pack.stories); uniqueIds(owner, "explorations", pack.explorations);
    return pack;
  }

  function versionParts(value) {
    var match = String(value || "0").match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    return match ? [Number(match[1]), Number(match[2] || 0), Number(match[3] || 0)] : [0, 0, 0];
  }

  function compareVersion(a, b) {
    var left = versionParts(a), right = versionParts(b);
    for (var index = 0; index < 3; index++) if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
    return 0;
  }

  function disable(pack, reason) {
    if (!pack.enabled) return;
    pack.enabled = false; pack.disabledReason = reason;
    recordError(pack.id, "compatibility", new Error(reason));
  }

  function finalize() {
    if (finalized) return packs.filter(function (pack) { return pack.enabled; }).length;
    finalized = true;
    packs.forEach(function (pack) {
      if (pack.apiVersion > API_VERSION) disable(pack, "Requires content API " + pack.apiVersion + ", runtime is " + API_VERSION);
      else if (compareVersion(GAME_VERSION, pack.game.min) < 0 || compareVersion(GAME_VERSION, pack.game.maxExclusive) >= 0) disable(pack, "Game " + GAME_VERSION + " is outside supported range");
    });
    packs.forEach(function (pack) {
      if (!pack.enabled) return;
      pack.dependencies.forEach(function (dependency) {
        var target = packById[dependency.id];
        if (!target || !target.enabled) disable(pack, "Missing dependency " + dependency.id);
        else if (target.version < dependency.minVersion) disable(pack, "Dependency " + dependency.id + " needs version " + dependency.minVersion);
      });
    });
    var pending = packs.filter(function (pack) { return pack.enabled; });
    var emitted = Object.create(null), sorted = [];
    while (pending.length) {
      var ready = pending.filter(function (pack) { return pack.dependencies.every(function (dependency) { return emitted[dependency.id]; }); });
      if (!ready.length) { pending.forEach(function (pack) { disable(pack, "Dependency cycle detected"); }); break; }
      ready.sort(function (a, b) { return a.order - b.order; });
      ready.forEach(function (pack) { emitted[pack.id] = true; sorted.push(pack); });
      pending = pending.filter(function (pack) { return !emitted[pack.id]; });
    }
    var accepted = [];
    sorted.forEach(function (pack) {
      var conflict = accepted.find(function (other) { return pack.conflicts.indexOf(other.id) >= 0 || other.conflicts.indexOf(pack.id) >= 0; });
      if (conflict) disable(pack, "Conflicts with " + conflict.id); else accepted.push(pack);
    });
    orderedPacks = accepted;
    emit("runtime:finalized", { enabled: accepted.map(function (pack) { return pack.id; }) });
    return accepted.length;
  }

  function register(raw) {
    try {
      if (finalized) throw new Error("Content registration is closed after finalize()");
      var pack = normalizePack(raw);
      if (packById[pack.id]) throw new Error("Duplicate content pack id: " + pack.id);
      packById[pack.id] = pack; packs.push(pack);
      emit("pack:registered", { id: pack.id, version: pack.version });
      return true;
    } catch (error) {
      recordError(raw && raw.id, "register", error);
      return false;
    }
  }

  function applyMigration(data, migration) {
    if (!isRecord(migration)) throw new Error("Migration must be an object");
    if (isRecord(migration.rename)) Object.keys(migration.rename).forEach(function (from) {
      if (from === "__proto__" || from === "constructor" || from === "prototype") return;
      var to = migration.rename[from];
      if (typeof to !== "string" || to === "__proto__" || to === "constructor" || to === "prototype") throw new Error("Migration rename target must be a string");
      if (Object.prototype.hasOwnProperty.call(data, from)) { data[to] = data[from]; delete data[from]; }
    });
    if (isRecord(migration.set)) data = mergeDefaults(data, migration.set);
    if (Array.isArray(migration.remove)) migration.remove.forEach(function (key) { delete data[key]; });
    return data;
  }

  function migratePackData(pack, original, exists) {
    var currentVersion = Math.max(0, Math.floor(Number(original.__version) || 0));
    if (currentVersion > pack.version) throw new Error("Save version " + currentVersion + " is newer than pack " + pack.version);
    var data = mergeDefaults(pack.saveDefaults, isRecord(original.data) ? original.data : original);
    if (!exists || currentVersion === 0) return { __version: pack.version, data: data };
    var migrations = pack.migrations.map(function (entry) { return clone(entry); });
    while (currentVersion < pack.version) {
      var matches = migrations.filter(function (migration) { return Math.floor(Number(migration.from) || 0) === currentVersion; });
      if (matches.length !== 1) throw new Error("Expected exactly one migration from version " + currentVersion);
      var to = Math.floor(Number(matches[0].to));
      if (to !== currentVersion + 1 || to > pack.version) throw new Error("Migration must advance exactly one version from " + currentVersion);
      data = applyMigration(data, matches[0]); currentVersion = to;
    }
    return { __version: currentVersion, data: data };
  }

  function migrateSave(save) {
    finalize();
    var target = isRecord(save) ? save : {};
    if (!isRecord(target.extensions)) target.extensions = {};
    orderedPacks.forEach(function (pack) {
      var exists = Object.prototype.hasOwnProperty.call(target.extensions, pack.id);
      var original = isRecord(target.extensions[pack.id]) ? clone(target.extensions[pack.id]) : {};
      try { target.extensions[pack.id] = migratePackData(pack, original, exists); }
      catch (error) {
        target.extensions[pack.id] = { __version: Math.max(0, Math.floor(Number(original.__version) || 0)), data: isRecord(original.data) ? original.data : {}, __disabled: true };
        recordError(pack.id, "migration", error);
      }
    });
    return target;
  }

  function content(kind) {
    finalize();
    var output = [];
    orderedPacks.forEach(function (pack) {
      var list = pack[kind];
      if (!Array.isArray(list)) return;
      list.forEach(function (entry) { output.push(Object.assign({ __packId: pack.id }, clone(entry))); });
    });
    return output;
  }

  function assets(packId) { var pack = packById[String(packId || "")]; return pack && pack.enabled ? clone(pack.assets) : {}; }
  function state(save, packId) { var pack = packById[String(packId || "")]; if (!pack || !pack.enabled || !isRecord(save) || !isRecord(save.extensions) || !isRecord(save.extensions[packId])) return null; var entry = save.extensions[packId]; return entry.__disabled || !isRecord(entry.data) ? null : entry.data; }

  function on(eventName, handler, owner) {
    if (typeof handler !== "function") throw new Error("Event handler must be a function");
    var name = String(eventName || "");
    (listeners[name] || (listeners[name] = [])).push({ handler: handler, owner: owner || "core" });
    return function () { listeners[name] = (listeners[name] || []).filter(function (entry) { return entry.handler !== handler; }); };
  }

  function emit(eventName, payload) {
    (listeners[String(eventName || "")] || []).slice().forEach(function (entry) { try { entry.handler(payload); } catch (error) { recordError(entry.owner, "event:" + eventName, error); } });
  }

  function hook(name, handler, owner, priority) {
    if (!/^[a-z][a-z0-9:_-]{2,63}$/.test(String(name || ""))) throw new Error("Invalid hook name");
    if (typeof handler !== "function") throw new Error("Hook handler must be a function");
    var entry = { handler: handler, owner: owner || "core", priority: Number(priority) || 0, order: (hooks[name] || []).length };
    (hooks[name] || (hooks[name] = [])).push(entry);
    hooks[name].sort(function (a, b) { return a.priority - b.priority || a.order - b.order; });
    return function () { hooks[name] = (hooks[name] || []).filter(function (candidate) { return candidate !== entry; }); };
  }

  function runHooks(name, payload) {
    (hooks[String(name || "")] || []).slice().forEach(function (entry) {
      var ownerPack = packById[entry.owner];
      if (ownerPack && !ownerPack.enabled) return;
      try { entry.handler(payload); } catch (error) { recordError(entry.owner, "hook:" + name, error); }
    });
    return payload;
  }

  function hookStatus() { var output = {}; Object.keys(hooks).forEach(function (name) { output[name] = hooks[name].map(function (entry) { return { owner: entry.owner, priority: entry.priority }; }); }); return clone(output); }
  function reportLoadError(path) { recordError(String(path || "unknown"), "load", new Error("Content pack script failed to load")); }
  function guard(owner, phase, operation, fallback) { try { return operation(); } catch (error) { recordError(owner, phase, error); return fallback; } }

  function queryEnabled(when) {
    if (!isRecord(when) || !when.queryParam) return true;
    var name = String(when.queryParam).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var pattern = new RegExp("(?:\\?|&)" + name + "=" + String(when.equals === undefined ? "1" : when.equals).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:&|$)");
    return pattern.test(global.location && global.location.search || "");
  }

  function loadManifest(entries) {
    if (global.__SAKURAYO_BUNDLED_PACKS__) return;
    if (!Array.isArray(entries)) { recordError("manifest", "load", new Error("Extension manifest must be an array")); return; }
    if (document.readyState !== "loading") { recordError("manifest", "load", new Error("Extension manifest must load during document parsing")); return; }
    entries.forEach(function (entry) {
      var descriptor = typeof entry === "string" ? { path: entry } : entry;
      if (!isRecord(descriptor) || !queryEnabled(descriptor.when)) return;
      var src = String(descriptor.path || "");
      if (!/^content\/packs\/[a-z0-9._-]+\/pack\.js$/.test(src)) { recordError("manifest", "path", new Error("Rejected extension path: " + src)); return; }
      document.write('<script src="' + src.replace(/"/g, "&quot;") + '" onerror="SakurayoContent.reportLoadError(this.src)"><\/script>');
    });
  }

  // Bundled packs are trusted source compiled into the offline HTML, not a sandbox.
  function loadBundledPack(path, source) {
    try {
      var code = String(source || "") + "\n//# sourceURL=" + String(path || "content-pack").replace(/\s/g, "_");
      Function("SakurayoContent", "window", "'use strict';\n" + code)(api, global);
      return true;
    } catch (error) {
      recordError(String(path || "unknown"), "compile", error);
      return false;
    }
  }

  api = Object.freeze({
    apiVersion: API_VERSION, gameVersion: GAME_VERSION, register: register, finalize: finalize, migrateSave: migrateSave,
    content: content, assets: assets, state: state, on: on, emit: emit, hook: hook, runHooks: runHooks, hookStatus: hookStatus,
    loadManifest: loadManifest, loadBundledPack: loadBundledPack, reportLoadError: reportLoadError, guard: guard,
    errors: function () { return clone(errors); },
    packs: function () { finalize(); return packs.map(function (pack) { return { id: pack.id, version: pack.version, title: pack.title, apiVersion: pack.apiVersion, enabled: pack.enabled, disabledReason: pack.disabledReason, dependencies: clone(pack.dependencies) }; }); },
  });
  global.SakurayoContent = api;
})(window);

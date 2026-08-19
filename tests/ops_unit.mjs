import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-ops.js"), "utf8");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");

assert.doesNotMatch(code, /update\s*=\s*function/);
assert.match(html, /runtime\/sakurayo-ops\.js/);
assert.match(html, /CONTENT41\.hook\("combat:after-update"/);
assert.match(html, /core\.ops46/);
assert.doesNotMatch(html, /update=function\(dt\)\{[^}]*SakurayoOps/);
assert.doesNotMatch(code, /html\.landscape46 #opsDock46\{[^}]*bottom:max\(18px/);
assert.match(code, /html\.landscape46 #opsDock46\{[^}]*bottom:max\(168px/);
assert.match(html, /closest\("#opsDock46"\)/);

const sandbox = { window: {}, document: null, Math, Object, Array, Number, String, Set };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const O = sandbox.window.SakurayoOps;

assert.equal(O.version, "4.6.0");
assert.equal(O.MAX, 2);
assert.equal(O.COST, 8);
assert.equal(O.START, 10);
assert.equal(O.roster("sayo").join(","), "aya,rion");
assert.equal(O.enabled("story"), true);
assert.equal(O.enabled("mainGod"), true);
assert.equal(O.enabled("testimony"), false);

O.reset();
assert.equal(O.snapshot().dp, 10);
assert.equal(O.canDeploy("sayo", "sayo").reason, "self");
assert.equal(O.deploy("sayo", "sayo", 200, 400, 430, 932).ok, false);

const first = O.deploy("aya", "sayo", 200, 400, 430, 932);
assert.equal(first.ok, true);
assert.equal(first.snapshot.dp, 2);
assert.equal(first.snapshot.units.length, 1);
assert.equal(first.snapshot.units[0].id, "aya");
assert.ok(Math.abs(first.snapshot.units[0].x - 200) > 40);

assert.equal(O.deploy("rion", "sayo", 200, 400, 430, 932).reason, "dp");
O.grant(8);
const second = O.deploy("rion", "sayo", 200, 400, 430, 932);
assert.equal(second.ok, true);
assert.equal(second.snapshot.units.length, 2);
assert.equal(O.deploy("aya", "sayo", 200, 400, 430, 932).reason, "out");

const retreat = O.retreat("aya");
assert.equal(retreat.ok, true);
assert.equal(retreat.snapshot.units.length, 1);
assert.equal(retreat.snapshot.dp, Math.min(O.CAP, second.snapshot.dp + 4));

O.reset();
O.deploy("aya", "sayo", 120, 300, 430, 932);
const idle = O.tick(0.2, { play: true, mode: "story", dmg: 10, petPow: 1, nearest: () => null });
assert.equal(idle.shots.length, 0);

const target = { x: 160, y: 300 };
const ready = O.tick(1.2, {
  play: true,
  mode: "story",
  dmg: 10,
  petPow: 1,
  nearest: () => target,
});
assert.equal(ready.shots.length, 1);
assert.equal(ready.shots[0].id, "aya");
assert.equal(ready.shots[0].weapon, "pistol");

const bullets = [];
const slashes = [];
O.fireShots(ready.shots, {
  pushBullet(b) {
    bullets.push(b);
  },
  aoe(x, y, r, dmg) {
    slashes.push({ x, y, r, dmg });
  },
});
assert.equal(bullets.length, 1);
assert.equal(bullets[0].source, "summon");
assert.ok(bullets[0].dmg < 10);

O.reset();
O.deploy("rion", "aya", 120, 300, 430, 932);
const blade = O.tick(1.2, {
  play: true,
  mode: "story",
  dmg: 12,
  petPow: 1,
  nearest: () => ({ x: 130, y: 300 }),
});
assert.equal(blade.shots[0].weapon, "blade");
const cuts = [];
O.fireShots(blade.shots, {
  aoe(x, y, r, dmg, _c, _p, opt) {
    cuts.push({ x, y, r, dmg, source: opt.source });
  },
});
assert.equal(cuts.length, 1);
assert.equal(cuts[0].source, "summon");

const silent = O.tick(1, { play: true, mode: "testimony", dmg: 10, nearest: () => ({ x: 1, y: 1 }) });
assert.equal(silent.shots.length, 0);

let dmgCalls = 0;
O.reset();
O.grant(20);
O.deploy("aya", "sayo", 100, 100, 430, 932);
O.deploy("rion", "sayo", 100, 100, 430, 932);
O.tick(1.2, {
  play: true,
  mode: "story",
  dmg: 10,
  nearest: () => {
    dmgCalls += 1;
    return { x: 110, y: 100 };
  },
});
assert.ok(dmgCalls <= 2);

console.log("PASS ops unit: DP, 2 pins, testimony off, no update wrap");

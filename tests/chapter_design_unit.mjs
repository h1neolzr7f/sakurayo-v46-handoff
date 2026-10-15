import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = { window: {}, Math, Object, Number, String, Array };
vm.runInNewContext(fs.readFileSync(path.join(root, "src/runtime/sakurayo-camera.js"), "utf8"), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(root, "src/runtime/sakurayo-lifecycle.js"), "utf8"), sandbox);
const L = sandbox.window.SakurayoLifecycle;
const C = sandbox.window.SakurayoCamera;
const photo = { complete: true, naturalWidth: 2048, naturalHeight: 1024 };

function canvas() {
  const events = [];
  const ctx = { events, fillStyle: "", strokeStyle: "", lineWidth: 1,
    createLinearGradient() { return { addColorStop() {} }; } };
  for (const name of ["save", "restore", "translate", "beginPath", "moveTo", "lineTo", "closePath", "stroke", "fill", "arc", "ellipse", "rotate", "fillRect", "strokeRect", "drawImage"]) {
    ctx[name] = (...args) => events.push({ name, args, fill: ctx.fillStyle, stroke: ctx.strokeStyle });
  }
  return ctx;
}
function world(stageId, extra = {}) {
  return { stageId, W: 932, H: 430, worldW: 3728, worldH: 860, cols: 4, rows: 2,
    camX: 0, camY: 0, quality: 1, runTime: 5, battleBg: photo, ...extra };
}
C.configure(932, 430);
C.snap(466, 215);

// Terrain textures retain their native scale across the whole camera world.
const tiled=canvas();let patternCalls=0;
tiled.createPattern=()=>{patternCalls++;return {terrain:true};};
const tiledWorld=world(1,{tiledGround:true});
L.drawGround(tiled,tiledWorld);L.drawGround(tiled,tiledWorld);
assert.equal(patternCalls,1,'cache terrain pattern instead of rebuilding every frame');
assert.equal(tiled.events.filter(e=>e.name==='drawImage').length,0,'floor must not stretch to four-screen world width');
assert.ok(tiled.events.some(e=>e.name==='fillRect'&&e.args[2]===3728&&e.fill?.terrain));

// Removing the shared atmosphere pass must fail: ready photo backgrounds still animate.
for (let chapter = 1; chapter <= 4; chapter++) {
  const ctx = canvas();
  L.drawGround(ctx, world(chapter));
  assert.equal(ctx.events.filter(e => e.name === "drawImage").length, 1, "photo must cover the world once");
  assert.ok(ctx.events.some(e => ["ellipse", "arc", "lineTo"].includes(e.name)), `chapter ${chapter}: photo ground keeps visible atmosphere`);
  const next = canvas();
  L.drawGround(next, world(chapter, { runTime: 5.5 }));
  assert.notDeepEqual(next.events, ctx.events, `chapter ${chapter}: time advances weather`);
  const low = canvas();
  L.drawGround(low, world(chapter, { quality: 0.6 }));
  assert.ok(low.events.length < ctx.events.length, `chapter ${chapter}: low quality reduces weather work`);
  const late = canvas();
  L.drawGround(late, world(chapter, { runTime: 86400 }));
  assert.ok(late.events.length <= ctx.events.length + 4, "elapsed time does not grow effects");
  for (const event of late.events) for (const value of event.args) if (typeof value === "number") assert.ok(Number.isFinite(value));
}
const still = canvas(), stillAgain = canvas();
L.drawGround(still, world(2));
L.drawGround(stillAgain, world(2));
assert.deepEqual(still.events, stillAgain.events, "paused combat does not advance environment animation");

// A visibility check must skip world copies outside the current view.
for (let chapter = 1; chapter <= 4; chapter++) {
  const offscreen = canvas();
  L.drawObstacles(offscreen, world(chapter, { camX: 10000, camY: 10000 }));
  assert.equal(offscreen.events.length, 0, `chapter ${chapter}: offscreen obstacles have no draw work`);
}

// Render geometry must keep the existing combat rules, not add new hazards.
for (let chapter = 1; chapter <= 4; chapter++) {
  const w = world(chapter);
  assert.equal(L.obstacles(w).length, chapter === 1 ? 24 : 16);
  const obstacle = L.obstacles(w)[0];
  const bullet = { x: obstacle.x + (obstacle.w || 0) / 2, y: obstacle.y + (obstacle.h || 0) / 2, r: 4, vx: 10, vy: 0, life: 1 };
  if (chapter <= 2) assert.equal(L.deflectBullet(bullet, w), 1);
  if (chapter === 1) assert.equal(L.resolvePlayer(obstacle.x, obstacle.y, 14, w).x, obstacle.x);
  if (chapter === 2) {
    const p = L.resolvePlayer(bullet.x, bullet.y, 14, w);
    assert.ok(p.x !== bullet.x || p.y !== bullet.y, "vehicles block movement");
    assert.match(L.hint(w), /挡住移动/);
  }
  if (chapter === 3) {
    const p = L.resolvePlayer(obstacle.x, obstacle.y, 14, w);
    assert.equal(p.slow, 0.78);
    assert.equal(p.melee, 1.18);
    const ctx = canvas(); L.drawObstacles(ctx, w);
    assert.ok(ctx.events.some(e => e.name === "arc" && e.args[0] === obstacle.x && e.args[1] === obstacle.y && e.args[2] === 72), "sword field boundary matches gameplay radius");
  }
  if (chapter === 4) {
    assert.equal(L.deflectBullet(bullet, w), 0);
    assert.equal(bullet.vx, -10);
    assert.equal(L.deflectBullet({ ...bullet, x: obstacle.x + 5 }, w), 1, "mirror refracts only once");
  }
}

// A new run must clear mirror history and never render initial origin samples.
const echoWorld = world(4, { playerX: 450, playerY: 200, runTime: 0 });
const firstEcho = canvas(); L.drawGround(firstEcho, echoWorld);
const echoes = firstEcho.events.filter(e => e.name === "ellipse" && e.args[2] === 18 && e.args[3] === 7);
assert.ok(echoes.length >= 1 && echoes.every(e => e.args[0] === 450), "first echo comes from the player");
for (let frame = 1; frame <= 100; frame++) L.drawGround(canvas(), { ...echoWorld, runTime: frame * 0.1, playerX: 450 + frame });
const restart = canvas(); L.drawGround(restart, { ...echoWorld, playerX: 700 });
const restarted = restart.events.filter(e => e.name === "ellipse" && e.args[2] === 18 && e.args[3] === 7);
assert.deepEqual(restarted.map(e => e.args[0]), [700], "time reset discards previous run echoes");
const bounded = canvas(); L.drawGround(bounded, { ...echoWorld, runTime: 20, playerX: 710 });
assert.ok(bounded.events.filter(e => e.name === "ellipse" && e.args[2] === 18 && e.args[3] === 7).length <= 6);
console.log("chapter_design_unit ok");

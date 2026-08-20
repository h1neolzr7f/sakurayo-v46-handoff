import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-camera.js"), "utf8");

assert.match(html, /runtime\/sakurayo-camera\.js/);
assert.doesNotMatch(html, /update\s*=\s*function[\s\S]{0,120}SakurayoCamera/);
assert.doesNotMatch(code, /pitySSR|gacha|shop40\.ops/);

const sandbox = { window: {}, Math, Object, Number, String };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const C = sandbox.window.SakurayoCamera;

assert.equal(C.version, "4.6.3");
assert.equal(C.COLS, 4);
assert.equal(C.ROWS, 2);

const view = C.configure(430, 932);
assert.equal(view.worldW, 1720);
assert.equal(view.worldH, 1864);
assert.equal(view.screens, 8);

C.snap(view.worldW / 2, view.worldH / 2);
const mid = C.current();
assert.ok(Math.abs(mid.x + 430 / 2 - view.worldW / 2) < 0.01);
assert.ok(Math.abs(mid.y + 932 / 2 - view.worldH / 2) < 0.01);

const left = C.snap(28, 73);
assert.equal(left.x, 0);
assert.equal(left.y, 0);
assert.ok(left.x >= 0 && left.x <= view.worldW - view.viewW);
assert.ok(left.y >= 0 && left.y <= view.worldH - view.viewH);

const right = C.snap(view.worldW - 28, view.worldH - 22);
assert.equal(right.x, view.worldW - view.viewW);
assert.equal(right.y, view.worldH - view.viewH);

C.follow(28, 73, 1, true);
const edgeFollow = C.current();
assert.equal(edgeFollow.x, 0);
assert.equal(edgeFollow.y, 0);

C.snap(view.worldW / 2, view.worldH / 2);
const screen = C.worldToScreen(view.worldW / 2, view.worldH / 2);
assert.ok(Math.abs(screen.x - 215) < 0.5);
assert.ok(Math.abs(screen.y - 466) < 0.5);

const world = C.screenToWorld(215, 466);
assert.ok(Math.abs(world.x - view.worldW / 2) < 0.5);
assert.ok(Math.abs(world.y - view.worldH / 2) < 0.5);

assert.equal(C.contains(view.worldW / 2, view.worldH / 2, 0), true);
assert.equal(C.contains(mid.x - 80, mid.y + 10, 0), false);

const edge = C.clampPlayer(-20, -20, { edgeX: 28, edgeTop: 73, edgeBottom: 22 });
assert.equal(edge.x, 28);
assert.equal(edge.y, 73);

const rolls = [0.0, 0.3, 0.55, 0.8];
const sides = new Set();
for (const roll of rolls) {
  const spawn = C.spawnOutside(65, () => roll);
  sides.add(spawn.side);
  assert.equal(C.contains(spawn.x, spawn.y, 0), false);
  assert.equal(C.contains(spawn.x, spawn.y, 80), true);
}
assert.equal(sides.size, 4);

C.snap(view.worldW / 2, view.worldH / 2);
C.follow(view.worldW / 2 + 200, view.worldH / 2, 1 / 60, false);
const lagged = C.current();
assert.ok(lagged.x > mid.x);
assert.ok(lagged.x < mid.x + 200);

const chunks = C.visibleChunks();
assert.ok(chunks.length >= 1);
assert.ok(chunks.length <= 8);
assert.ok(chunks.every((c) => c.col >= 0 && c.col < 4 && c.row >= 0 && c.row < 2));

console.log("camera_unit ok");

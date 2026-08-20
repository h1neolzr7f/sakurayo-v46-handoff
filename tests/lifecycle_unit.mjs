import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cameraSrc = fs.readFileSync(path.join(root, "src/runtime/sakurayo-camera.js"), "utf8");
const lifeSrc = fs.readFileSync(path.join(root, "src/runtime/sakurayo-lifecycle.js"), "utf8");

const sandbox = { window: {}, Math, Object, Number, String, Array };
sandbox.globalThis = sandbox;
vm.runInNewContext(cameraSrc, sandbox);
vm.runInNewContext(lifeSrc, sandbox);
const C = sandbox.window.SakurayoCamera;
const L = sandbox.window.SakurayoLifecycle;

assert.equal(L.version, "4.6.6");
C.configure(430, 932);
C.snap(860, 932);

const draws = [];
const ctx = {
  save() {},
  restore() {},
  translate() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  stroke() {},
  fill() {},
  arc() {},
  ellipse() {},
  rotate() {},
  createLinearGradient() { return { addColorStop() {} }; },
  fillRect() {},
  strokeRect() {},
  rect() {},
  clip() {},
  drawImage(img, x, y, w, h) { draws.push({ w, h }); },
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
};

const world = {
  stageId: 1,
  W: 430,
  H: 932,
  worldW: 1720,
  worldH: 1864,
  camX: C.current().x,
  camY: C.current().y,
  cols: 4,
  rows: 2,
  quality: 1,
  runTime: 1,
  battleBg: { complete: true, naturalWidth: 1280, naturalHeight: 720 },
};

L.drawGround(ctx, world);
assert.ok(draws.length >= 1, "可见镜头至少铺一张战场图");
assert.ok(draws.every((d) => d.h <= 932 + 1), "战场图按屏高铺，不再拉满整张大地图");

C.snap(28, 73);
world.camX = C.current().x;
world.camY = C.current().y;
draws.length = 0;
L.drawGround(ctx, world);
assert.ok(draws.length >= 1, "夹边后仍铺战场图");
assert.ok(draws.every((d) => d.h <= 932 + 1), "夹边后仍按屏铺");

console.log("lifecycle_unit ok");

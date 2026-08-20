import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "src/index.html"), "utf8");
assert.match(html, /runtime\/sakurayo-live\.js/);
assert.doesNotMatch(html, /update\s*=\s*function[\s\S]{0,80}SakurayoLive/);

const code = fs.readFileSync(path.join(root, "src/runtime/sakurayo-live.js"), "utf8");
const sandbox = { window: {}, document: null, Math, Object, Number, String };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const L = sandbox.window.SakurayoLive;

assert.doesNotMatch(code, /rotateHint46|portraitFallback46|tallWindow46/);
assert.equal(L.version, "4.6.3");
assert.equal(L.BLINK.mean, 2.5);
assert.equal(L.BLINK.deviation, 2);
assert.equal(L.blinkEnvelope(-1), 1);
assert.equal(L.blinkEnvelope(0), 1);
assert.ok(L.blinkEnvelope(L.BLINK.close) <= 0.001);
assert.equal(L.blinkEnvelope(L.BLINK.close + L.BLINK.hold), 0);
assert.ok(L.blinkEnvelope(L.blinkDuration()) >= 0.999);

const waits = Array.from({ length: 12 }, (_, i) => L.nextBlinkWait(() => i / 11));
assert.ok(Math.min(...waits) >= 0.55);
assert.ok(Math.max(...waits) <= 4.5);
assert.ok(new Set(waits.map((n) => n.toFixed(3))).size > 3);

const damped = L.damp(0, 1, 0.16, 0.16);
assert.ok(damped > 0.55 && damped < 0.75);

const a = L.idlePose(0);
const b = L.idlePose(1.2);
assert.notEqual(a.sway.toFixed(4), b.sway.toFixed(4));

const state = L.createState({ test: true });
assert.equal(state.eye, 1);
assert.ok(state.blinkWait > 100);
L.triggerState(state, "tapHead", () => 0);
assert.equal(state.lastKind, "tapHead");
assert.equal(state.motionId, "tapHead");
assert.equal(state.blinkT, 0);
for (let i = 0; i < 8; i++) L.stepState(state, 0.016, () => 0);
assert.ok(state.eye < 1);
for (let i = 0; i < 80; i++) L.stepState(state, 0.016, () => 0);
assert.equal(state.motionId, "");
assert.equal(state.eye, 1);

const look = L.createState({ test: true });
look.targetX = 1;
for (let i = 0; i < 20; i++) L.stepState(look, 0.016, () => 0);
assert.ok(look.lookX > 0.4);

console.log("PASS live unit: blink interval, look damp, tapHead trigger");

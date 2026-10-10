/* Boss break ("破防") gauge: every boss phase has a visible gauge. Damage from any source fills it
   (character-neutral), stage objectives fill it faster. A full gauge staggers the boss: it stops
   moving and attacking and takes extra damage for a short window. Phase 4 enrages after a while
   (more bullets, no extra damage) so fights cannot drag. Pure logic, no DOM. */
(function (global) {
  "use strict";
  var BREAK_TIME = 4.5, BREAK_MUL = 1.6, DAMAGE_SHARE = 0.11, ENRAGE_AFTER = 20, HP_SCALE = 0.88, HP_PER_PICK = 0.02, MIN_PHASE = 9, OVERTIME_AFTER = 36, OVERTIME_RATE = 0.25;
  var OBJECTIVE = { guard: 30, dodge: 15, lane: 10, burst: 40 };
  function init(boss) { boss.brk46 = 0; boss.broken46 = 0; boss.breaks46 = 0; boss.enraged46 = false; boss.guardsDown46 = 0; boss.guardsTotal46 = 0; return boss; }
  function fill(boss, amount) {
    if (!boss || boss.dead || boss.broken46 > 0) return false;
    boss.brk46 = Math.min(100, (boss.brk46 || 0) + Math.max(0, amount));
    if (boss.brk46 >= 100) { boss.brk46 = 0; boss.broken46 = BREAK_TIME; boss.breaks46 = (boss.breaks46 || 0) + 1; return true; }
    return false;
  }
  function fromDamage(boss, damage) { return damage / Math.max(1, boss.max * DAMAGE_SHARE) * 100; }
  function tick(boss, dt, phaseAge) {
    var ev = null;
    if (boss.broken46 > 0) { boss.broken46 = Math.max(0, boss.broken46 - dt); if (!boss.broken46) ev = "recover"; }
    if (boss.phase >= 4 && !boss.enraged46 && phaseAge >= ENRAGE_AFTER) { boss.enraged46 = true; ev = "enrage"; }
    return ev;
  }
  // Phase gate: a phase cannot be skipped faster than MIN_PHASE seconds (HP holds at the threshold, "阶段护盾").
  function gateHp(boss, phaseAge, hpBefore) {
    if (!boss || boss.phase >= 4 || phaseAge >= MIN_PHASE) { if (boss) boss.gated46 = false; return boss ? boss.hp : 0; }
    var floor = boss.max * (1 - 0.25 * boss.phase) + 1;
    if (hpBefore != null && hpBefore < floor) { boss.gated46 = false; return boss.hp; }
    boss.gated46 = boss.hp < floor; return Math.max(boss.hp, floor);
  }
  // Overtime: past OVERTIME_AFTER seconds the mirror world cracks and the boss takes rising damage.
  function overtimeMul(fightAge) { return fightAge > OVERTIME_AFTER ? 1 + (fightAge - OVERTIME_AFTER) * OVERTIME_RATE : 1; }
  function damageMul(boss) { return boss && boss.broken46 > 0 ? BREAK_MUL : 1; }
  function label(boss) {
    if (!boss) return "";
    if (boss.broken46 > 0) return "失衡！伤害 ×" + BREAK_MUL + " · " + boss.broken46.toFixed(1) + "s";
    var g = boss.guardsTotal46 ? " · 镜卫 " + boss.guardsDown46 + "/" + boss.guardsTotal46 : "";
    return (boss.gated46 ? "阶段护盾 · " : "") + "破防 " + Math.floor(boss.brk46 || 0) + "%" + g + (boss.enraged46 ? " · 狂暴" : "") + (boss.ot46 > 1.01 ? " · 镜界崩解 伤害×" + boss.ot46.toFixed(1) : "");
  }
  global.SakurayoBoss = Object.freeze({ BREAK_TIME: BREAK_TIME, BREAK_MUL: BREAK_MUL, ENRAGE_AFTER: ENRAGE_AFTER, HP_SCALE: HP_SCALE, HP_PER_PICK: HP_PER_PICK, OBJECTIVE: OBJECTIVE,
    init: init, gateHp: gateHp, overtimeMul: overtimeMul, MIN_PHASE: MIN_PHASE, OVERTIME_AFTER: OVERTIME_AFTER, fill: fill, fromDamage: fromDamage, tick: tick, damageMul: damageMul, label: label });
})(typeof window !== "undefined" ? window : globalThis);

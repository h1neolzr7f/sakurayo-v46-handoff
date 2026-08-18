# Cloud handoff: 主神默认解锁 + 快爽收尾

Reply to the user in 简体中文. User is dick (marketer). Work in this repo: `sakurayo-v46-handoff` on branch `yeying-qa-hotfix`.

## Goal

主神模式默认解锁，并且手感要快、要爽。不要改 `shortField()`、刷怪时钟/数量公式、普通关基础伤害公式。

## Already landed in `src/index.html` (keep)

- `mainGodOpen36() => true`
- Tiers: T1 72s / 3.4×XP, T2 88s / 3.8×, T3 104s / 4.2×, T4 118s / 4.6×
- Stage poster uses `content-packs/maingod-void/maps/void_arena.webp` (not chapter-4 art)
- Opening briefing hold 1100ms; opening lines already shortened in the first batch? verify
- Main-god XP step: `P.next *= 0.55`
- Contract popup: `runTime > (TEST_MODE ? 0.18 : 8)` so real play is not interrupted at 0.18s
- Void trash: after type pick, remap some `normal/fast` to `voidling` / `voidmaw` (type mix only)
- Hunter challenge is 100 kills
- Exploration pack copy says 默认可进
- Home pills HTML says 高难轮回

## MUST finish (this is why the last local turn died)

1. **Remove leftover chapter-4 lock** in `src/index.html`:
   - `pickHomeMode46` still toasts `通关第4章后解锁主神空间` and bounces to story
   - `applyPendingMode46` same
   - `paintHomeCommand46` still hides `[data-mode=mainGod]` unless `save.done.includes(4)` and toggles `.two46`
   - Fix: always show three pills, never hide/lock 主神, never bounce pendingMode off 主神
2. Confirm `src/content/packs/maingod-void/pack.js` description is the unlocked copy.
3. Rebuild Android assets:
   `python tools/build_game.py --source src/index.html --output android-app/app/src/main/assets/index.html`
   Copy changed runtime js into `android-app/app/src/main/assets/runtime/`
4. Tests: `node tests/lobby_unit.mjs`, `node tests/feel53_unit.mjs`, `node tests/regression_v47.mjs`
   Do not require chapter 4 clear for main-god UI.
5. Do **not** push `save.done` chapter 4 just to unlock 主神 (that pollutes story). `unlockMainGod()` test API may stay.

## Art inventory (already complete enough)

Present under `android-app/app/src/main/assets/game/art/content-packs/maingod-void/`:
- maps: `void_arena.webp`, `chapter5.webp`
- enemies: `voidling.webp`, `voidmaw.webp` (no `_b` frames; code already falls back)
- bosses: `void_phase1.webp`–`void_phase4.webp`
- cover: `ui/cover_v36_main_god.webp`

Do not generate new art unless a referenced file 404s.

## QA repo (optional, separate)

`C:\Users\tzzcomputer\yeying-dev-qa` has `scripts/inject_hotfix.js` / `flow_fix_all.py` that still hide 主神 when chapter 4 is not done. If that folder is not in this workspace, skip it and note it in the final reply.

## Done looks like

大厅三丸（回收 / 证词 / 主神）始终可见可点；章节卡主神无锁；开局约 72 秒、经验快、8 秒后再弹契约；资产已 rebuild。

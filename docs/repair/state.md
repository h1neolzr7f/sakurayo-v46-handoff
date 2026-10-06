# State repair — audit F08 / F09 / F17 / F18

## Scope and resulting behavior

- `resetP()` deletes every prior own property before rebuilding the same `P` object. `revive:0` and `lordRisk:1` are explicit neutral defaults. Character, aim/main-God upgrades, main-God challenge, story memory, combat state, shop/core/weapon state, fusion clocks and owned-card effects run once through named apply helpers. Six additional fusion mechanic flags, career passives and contracts cannot leak into the next run.
- `startGame()` is the stable entry for menu, tutorial launch, pause retry and result again. Mode selection/tutorial gates precede economy, sensory and DP initialization. Starting any mode resets units to zero and DP to 10; testimony continues to disable deployment and cards. Retry/again handlers call the current entry instead of capturing an earlier function.
- `gainXp()` keeps unspent XP while a card choice is open. Each threshold is consumed only while playing, applies its main-God level reward once and opens one choice. `chooseUpgrade()` requests the next pending threshold on resume. Testimony and no-upgrade challenge consume all available thresholds once and issue their existing healing reward without opening cards.
- `fixedUpdate()` exits immediately when a call changes the state from play: shooting, damage, stage events, boss actions, pickup upgrades and arena hazards. A Boss kill cannot be overwritten by later same-step ordinary-enemy contact. A collected gem is removed before returning for a choice; the other gems remain available. The twelfth-gem transmutation reward is applied before its XP can open a modal.
- `finish()` now guards every settlement effect before challenge credit, hidden awards, core settlement, balance sample, persistence and outfit rendering. Repeated calls cannot add challenge counts or balance samples.
- Ops HUD creates buttons once per character and updates only when DP/deployed IDs change. Stable buttons survive DP regeneration, deployment and retreat; unchanged data produces no DOM mutations. Ops shots no longer pre-multiply `petPow`; both bullets and blade AOE carry `pet:true` for the central damage pipeline.

Historical assignments/wrappers for `resetP`, `startGame`, `finish`, `gainXp` and `openLevel` are removed. Existing unrelated update, damage and UI wrappers are outside this group's scope.

## Verification and red/green evidence

- Initial `node tests/state_unit.mjs`: expected failures for stale fusion attributes, undefined first revive, consumed XP during choices, incomplete no-upgrade processing and inactive fixed steps.
- Initial ops unit damage regression: `petPow:2` produced 6.4 instead of the expected unmodified 3.2.
- Actual browser test against the unmodified baseline: failed on the elementalbeast flag surviving pause/retry (`true !== false`). Restoring the repaired source passes the same test.
- Self-review found an interrupted twelfth-gem transmutation. Its added regression failed with zero AOE calls, then passed after pickup effects moved before XP issuance.

Final commands completed successfully:

| Command | Result |
| --- | --- |
| `python tools/static_check.py` | 16 symbols, 17 scripts, asset paths pass |
| `node --check tests/artifacts/static/index.extracted.js` | pass |
| `node --check src/runtime/sakurayo-ops.js` | pass |
| `node tests/state_unit.mjs` | 8 production-function behavior tests pass |
| `node tests/ops_unit.mjs` | pass, including one modifier owner and pet flag |
| `node tests/camera_unit.mjs` | pass |
| `node tests/lifecycle_unit.mjs` | pass |
| `node tests/lobby_unit.mjs` | pass |
| `node tests/chronicle_unit.mjs` | pass |
| `node tests/live_unit.mjs` | pass |
| `node tests/state_smoke.mjs` | actual Chromium pass: tutorial, all six fusion resets, three mode retry/again, duplicate settlements, stable/no-mutation ops DOM, Boss kill plus same-step contact |
| `node tests/ops_smoke.mjs` | actual Chromium pass |
| `node tests/testimony_smoke.mjs` | actual Chromium pass |
| `git diff --check` / staged equivalent | pass |

`state_unit.mjs` executes the actual production reset/XP/settlement/fixed-step functions with boundary fixtures. `state_smoke.mjs` uses real Chromium and the existing frozen test API. It accepts `SAKURAYO_ENTRY` or its first CLI argument, then defaults to `src/index.html`, so integration can test an offline build too.

## Specification and quality self-review

The save key `sakurayoV3`, version 4.6.0 / Android code 61, all three characters, three run modes, offline assets and player object identity are preserved. The initializer uses explicit responsibilities instead of another wrapper. XP remains the single source of pending upgrades; no queue, duplicate counter, no-op fallback, lock or swallowed exception was introduced. Collision/damage formulas are left to the hits group, with only the agreed ops producer handoff changed here. The full reset also clears dynamic properties added by old/new builds; story memory is then intentionally restored from the existing save.

No HTML build, release synchronization, verify-script mutation, main/PR branch mutation or Android claim was made. Source/offline full integration and CI remain the root worker's responsibility. Local Chromium binary/zip had initially been truncated/SIGSEGV; the root worker recovered the complete browser and this group then ran the actual browser assertions above. Therefore the original “browser assertions not run” limitation no longer applies; Android device coverage and long-duration performance measurements remain unperformed.

## Remote persistence

Repository: `h1neolzr7f/sakurayo-v46-handoff`; branch: `codex/audit-fix-state`.

- Original remote base commit: `a334be6087f4ebe0e03d10ec2ada75f5ab475fa7`.
- Original remote base tree: `e8fff5277d89f9ea7c55d76cb06d8fe300a7fa49`.
- Final source/test checkpoint commit: `5bb6382df80ef2ca837b1de6d40fdd52b0d8f894`.
- Final source/test checkpoint tree: `d61a9c2c7437fb9da381631ed9172c78e8f1fce8`.

All published blobs were read from exact git-index bytes, base64 length checked and returned GitHub blob SHAs matched `git rev-parse :path`. This report is appended in a report-only child commit; its final branch head is returned with the worker delivery to avoid a self-referential commit hash. Existing baseline documentation differences are excluded from publishing.

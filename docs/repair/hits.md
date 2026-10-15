# Combat hit repair — 2026-10-06

Scope: F03, F10–F16, F30; precise circular status queries and per-projectile homing cost. Keeps the offline game, sakurayoV3, version 4.6.0 / Android code 61, three characters and three modes.

## Result and specification review

- F03: consumed/expired player and enemy projectiles immediately leave their hit phase.
- F10: acid/spore damage retains fractional values; display text still rounds. Real fixedUpdate yields 5.65 damage over one second at 30/60/120 steps with neutral fixture coefficients.
- F11: enemy bomb creates its explosion visual and damages the overlapping player, without invoking the player's enemy-targeting AoE.
- F12: bullet settlement forwards bioSplit into lastHit; a real kill now emits two non-recursive split projectiles.
- F13: single-core challenge reads P.careers entries with formed, instead of the unused careerFormed dictionary.
- F14: damageEnemy owns blade/pet multipliers. Directional slash, shadowblade, pet bullet generation and elemental beast generation no longer premultiply them. Explicit pet identity survives tech/bio projectiles and spell-source beast pulses. AoE forwards all existing hit options. Ops projectile identity is integrated by the state owner.
- F15: Grid tracks maximum inserted radius and clears it on rebuild. Bullets, AoE, directional slashes and orbit blades use their actual attack radius plus this maximum for broad phase and retain exact shape narrow phase.
- F16: enemyShot and radialBossShot enqueue through pushEnemyBullet, which checks caps for every projectile.
- F30: Boss adds clamp using Camera world dimensions and entity radius. Chapter-two teleport samples around the current player encounter, clamped to world bounds, instead of moving into the origin viewport.
- Circular frost, infection, fusion, spread, cleanse and purifier heal effects use Grid.within with actual squared distance. Collision/sector broad queries remain Grid.near followed by their exact shape test.
- Only homing bullets after the fixedUpdate grid rebuild use Grid.nearest(...,190). Other nearest calls continue to use live coordinates because their grid may be stale.

## Quality review

No new update/reset wrappers, locks, no-op fallback or swallowed error handling. Entity caps remain bounded. New query methods share the existing grid ownership and filtering semantics. Tests execute original production reset/damage/kill/projectile/fixedUpdate/geometry functions in VM fixtures; presentation callbacks and unrelated game services are neutral test dependencies. New unit tests accept SAKURAYO_ENTRY or argv[2] for integrated source verification.

## Validation

- Before implementation: original 23 regression cases failed against baseline. Expanded suite against original HEAD: 33 failed / 2 passed; the two passing elemental beast spell pulses protect previously correct single multiplication.
- Final hits_unit after movement review: 39 passed / 0 failed, including real fixedUpdate and original geometry functions.
- All 12 unit files (11 pre-existing plus hits_unit) passed.
- Python source static check and extracted inline JavaScript syntax passed.
- Content-pack, command-art and tactical-art checks passed.
- Real Playwright source browser_smoke passed all 52 checks, including three characters, four Boss stages, level selection, death/restart, testimony and mainGod, with no external requests or console errors.
- Initial environment limitation was truncated Chromium binary/zip and SIGSEGV. Root subsequently recovered the complete browser and enabled the successful real source regression above. No Android/device assertion or regenerated offline bundle validation is claimed; final integrated source/offline CI remains root responsibility.
- Did not build HTML or modify verify scripts.

## Persistence

Local source commit: 29e8e6ce0fc0a5f5d21f33ff9d5359000f39e053.

Remote code snapshot: a9662ac61184c1473859e6b212bb501cd6084e12; tree 31f47a36a34cdd0dbef66615b19e7ef9d305f387. Both original source/test blobs were read from exact git index bytes and their returned GitHub SHA matched git index SHA.

Durable branch: codex/audit-fix-hits in h1neolzr7f/sakurayo-v46-handoff. Final branch commit adds this report and the test fixture's direct production geometry loading; its SHA is supplied with delivery because a commit cannot embed its own hash. Remote tree retains base e8fff5277d89f9ea7c55d76cb06d8fe300a7fa49 and excludes unrelated worker baseline documents.

## Independent review correction: post-movement grid

Review reproduced an orbit miss when a normal enemy moved from x=152.2 to x=151.2666667 across a 76px grid cell at dt=1/60: player x=58.5, orbit center x=123.5, enemy radius18, overlap distance27.7666667. The old cell index excluded that valid hit from the new exact-radius broad phase.

Added four failing original-fixedUpdate regressions before the correction: this 11.52-damage orbit hit, a spore aura enemy moving into radius93, and purifier cleansing an entering enemy with both enemy array orders. Rebuild the bounded enemy grid once after the enemy movement loop. Purifier timers tick in the movement loop and cleanse effects execute against the rebuilt grid before spore aura and orbit blades. All targets now use completed movement positions; no guessed padding or per-projectile full scan was added. Removing the duplicated spore narrow check leaves Grid.within as its exact circle predicate.

Local correction commit: 4ee9f193bcbd17e6afa989381a10c852c7b01a8f. All 39 hit tests and all 12 unit files pass, source static/syntax passes, and source browser_smoke was rerun successfully with 52 checks after this correction. The durable branch is updated with the correction and this addendum; delivery supplies its final SHA.

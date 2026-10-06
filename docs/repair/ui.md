# UI/input audit repair

Scope: F04, F05, F25–F29, associated dead input code and UI ownership cleanup. Preserve sakurayoV3, offline loading, v4.6.0/code61, three characters and three modes.

First change: effective quality is computed once from user fx preference and adaptiveQuality48; joystick retains a single pointer owner; reveal enters the existing nested UI stack with one disposal callback; costumes without blink art retain their base; dialogue has a real focused Continue button and one advance per click; releaseInputs40 clears battle/exploration keys, joystick, and exploration capture at blur, modal and exploration closure. Exploration only prevents default on movement keys. Live rendering stops RAF while hidden and resumes when visibility changes, and its stylesheet is established once. Dead aim handlers, empty beta gesture, progression-art forwarding and overwritten shop bindings are removed. visibilitychange uses platformSuspend48/Resume48 declarations provided by the platform repair.

Evidence: new production-function unit initially failed at second touch replacing pointer owner (2 instead of 1). New browser smoke initially failed on baseline reveal UI owner (gachaDrawer instead of gachaReveal46). After fixes ui_input_unit, live_unit, lobby_unit, ui_input_smoke, ui_smoke, ui_dom_smoke and static/inline syntax checks pass.

Environment: original local Chromium binary/zip were truncated and SIGSEGV. Root recovered and verified a complete browser archive during this repair; real browser assertions listed above have now run locally. Platform visibility lifecycle awaits integration and CI; no Android device assertion has run.

Self-review: no new transaction lock, no save key/version changes, no build output or verify script changes, no economy/reset/start/finish or explore-step rewrite. Existing start sensory wrapper only changes quality assignment pending lifecycle integration.

Second change: settings, tutorial, save/import, analytics, ModKit, main-God exchange, beta and More utilities directly open/close through SakurayoUI. Tutorial onClose cancels its pending launch; More returns its existing utility buttons to their original container on close. All these retain their real handlers. Remove the drawer observer/adoption sync, blanket hiding, command direct-show fallback and roster detail keyboard/focus fallback. Existing old-WebView focus() fallback remains. Every reveal removal, including a refreshed gacha drawer, now calls UI.close and therefore disposes its stack entry.

Second evidence: legacy_ui_smoke first failed because More had no registered UI owner, then passed. UI_input_smoke also verifies native Tab and Enter on an exploration event choice. All 11 unit files pass; static_check and extracted inline script syntax pass; browser_smoke reports SMOKE PASS 52 checks; command_smoke, ui_smoke and ui_dom_smoke pass. Existing browser_smoke now explicitly accepts the reveal before clicking its parent close button, consistent with the repaired focus guard.

Persistent first checkpoint: local commit 3f33f86576e7b0cec957f45b7d7809cefd41f429; remote codex/audit-fix-ui commit a70be743b1d7ef3e923c1d7d668517ec556efb10; remote tree 326639209c81fb481bdfc42e11563e5ec4d1b333. Second checkpoint updates the same remote branch; exact final local/remote hashes are returned in the integration handoff.

# UI/input audit repair

Scope: F04, F05, F25–F29, associated dead input code and UI ownership cleanup. Preserve sakurayoV3, offline loading, v4.6.0/code61, three characters and three modes.

First change: effective quality is computed once from user fx preference and adaptiveQuality48; joystick retains a single pointer owner; reveal enters the existing nested UI stack with one disposal callback; costumes without blink art retain their base; dialogue has a real focused Continue button and one advance per click; releaseInputs40 clears battle/exploration keys, joystick, and exploration capture at blur, modal and exploration closure. Exploration only prevents default on movement keys. Live rendering stops RAF while hidden and resumes when visibility changes, and its stylesheet is established once. Dead aim handlers, empty beta gesture, progression-art forwarding and overwritten shop bindings are removed. visibilitychange uses platformSuspend48/Resume48 declarations provided by the platform repair.

Evidence: new production-function unit initially failed at second touch replacing pointer owner (2 instead of 1). New browser smoke initially failed on baseline reveal UI owner (gachaDrawer instead of gachaReveal46). After fixes ui_input_unit, live_unit, lobby_unit, ui_input_smoke, ui_smoke, ui_dom_smoke and static/inline syntax checks pass.

Environment: original local Chromium binary/zip were truncated and SIGSEGV. Root recovered and verified a complete browser archive during this repair; real browser assertions listed above have now run locally. Platform visibility lifecycle awaits integration and CI; no Android device assertion has run.

Self-review: no new transaction lock, no save key/version changes, no build output or verify script changes, no economy/reset/start/finish or explore-step rewrite. Existing start sensory wrapper only changes quality assignment pending lifecycle integration.

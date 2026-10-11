# BGM 生成

`python songs.py`（依赖 numpy、mido、fluidsynth、`/usr/share/sounds/sf2/FluidR3_GM.sf2`）→ `out/*.wav`，
再 `oggenc -q 2.5` 输出到 `android-app/app/src/main/assets/game/art/bgm/`。
旋律、和声、编曲全部由脚本原创；混响尾音折回循环起点，循环无缝。

"""artpipeline 全子命令回归：确认每个子命令都能正常加载（--help 返回 0）。"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CMDS = [
    "chroma", "trim", "rmbg", "pixel", "scale", "frames", "atlas", "webp",
    "swap", "hues", "hue", "sweep", "tint", "outline", "shadow", "flip", "grid", "info",
]

bad = []
for c in CMDS:
    r = subprocess.run(
        [sys.executable, str(ROOT / "artpipeline.py"), c, "--help"],
        capture_output=True, text=True, encoding="utf-8",
    )
    ok = r.returncode == 0
    if not ok:
        bad.append(c)
    print(f"  {c:10} {'OK' if ok else 'FAIL (' + str(r.returncode) + ')'}")

print(f"\n{len(CMDS) - len(bad)}/{len(CMDS)} 通过" + (f"，失败：{bad}" if bad else ""))
sys.exit(1 if bad else 0)

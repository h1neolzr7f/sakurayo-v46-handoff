"""Environment capability probe for game asset production.

Reports which image/audio libraries are importable, plus external CLI tools
that matter for turning AI-generated art into game-ready assets.
"""

import importlib
import shutil
import sys

PY_MODULES = [
    "PIL",
    "numpy",
    "cv2",
    "rembg",
    "onnxruntime",
    "imageio",
    "scipy",
    "skimage",
    "soundfile",
    "pydub",
    "numpy",
    "requests",
    "httpx",
    "yaml",
    # 素材高级管线（可选）
    "torch",
    "transformers",
    "rtmlib",
    "mido",
    "openai",
]

CLI_TOOLS = [
    "ffmpeg",
    "ffprobe",
    "cwebp",
    "magick",
    "convert",
    "node",
    "npm",
    "pnpm",
    "git",
    "java",
    "adb",
    "apktool",
    "jadx",
]

print("== Python %s ==" % sys.version.split()[0])
for name in PY_MODULES:
    try:
        mod = importlib.import_module(name)
        ver = getattr(mod, "__version__", "?")
        print("  %-14s OK    %s" % (name, ver))
    except Exception:
        print("  %-14s --" % name)

print("== CLI ==")
for tool in CLI_TOOLS:
    path = shutil.which(tool)
    print("  %-14s %s" % (tool, path if path else "--"))

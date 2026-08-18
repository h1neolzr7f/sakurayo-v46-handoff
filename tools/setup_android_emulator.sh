#!/usr/bin/env bash
# Install a local Android SDK + phone AVD for YeYing playtests.
set -euo pipefail

SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}"
export ANDROID_SDK_ROOT="$SDK_ROOT"
export ANDROID_HOME="$SDK_ROOT"
export PATH="$SDK_ROOT/cmdline-tools/latest/bin:$SDK_ROOT/platform-tools:$SDK_ROOT/emulator:$PATH"

AVD_NAME="${AVD_NAME:-sakurayo_phone}"
API="${AVD_API:-34}"
IMAGE="system-images;android-${API};google_apis;x86_64"
CMDLINE_URL="${CMDLINE_URL:-https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip}"

mkdir -p "$SDK_ROOT"
if [[ ! -x "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]]; then
  tmp="$(mktemp -d)"
  echo "Downloading Android command-line tools..."
  curl -fsSL "$CMDLINE_URL" -o "$tmp/cmdtools.zip"
  unzip -q "$tmp/cmdtools.zip" -d "$tmp"
  mkdir -p "$SDK_ROOT/cmdline-tools"
  if [[ -d "$tmp/cmdline-tools" ]]; then
    rm -rf "$SDK_ROOT/cmdline-tools/latest"
    mv "$tmp/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
  else
    rm -rf "$SDK_ROOT/cmdline-tools/latest"
    mv "$tmp/latest" "$SDK_ROOT/cmdline-tools/latest"
  fi
  rm -rf "$tmp"
fi

yes | sdkmanager --sdk_root="$SDK_ROOT" --licenses >/tmp/android-sdk-licenses.log 2>&1 || true
sdkmanager --sdk_root="$SDK_ROOT" \
  "platform-tools" \
  "emulator" \
  "platforms;android-36" \
  "platforms;android-${API}" \
  "build-tools;36.0.0" \
  "$IMAGE"

echo "no" | avdmanager create avd \
  --force \
  --name "$AVD_NAME" \
  --package "$IMAGE" \
  --device "pixel_7" \
  || true

ini="$HOME/.android/avd/${AVD_NAME}.avd/config.ini"
if [[ -f "$ini" ]]; then
  python3 - <<PY
from pathlib import Path
p = Path("$ini")
text = p.read_text(encoding="utf-8")
updates = {
    "hw.keyboard": "yes",
    "hw.gpu.enabled": "yes",
    "hw.gpu.mode": "swiftshader_indirect",
    "hw.ramSize": "2048",
    "hw.lcd.density": "420",
    "disk.dataPartition.size": "4096M",
    "showDeviceFrame": "no",
}
lines = []
seen = set()
for line in text.splitlines():
    key = line.split("=", 1)[0].strip()
    if key in updates:
        lines.append(f"{key}={updates[key]}")
        seen.add(key)
    else:
        lines.append(line)
for key, value in updates.items():
    if key not in seen:
        lines.append(f"{key}={value}")
p.write_text("\\n".join(lines) + "\\n", encoding="utf-8")
print("updated", p)
PY
fi

echo "SDK_ROOT=$SDK_ROOT"
echo "AVD=$AVD_NAME"
sdkmanager --sdk_root="$SDK_ROOT" --list_installed | sed -n '1,40p'
echo "READY"

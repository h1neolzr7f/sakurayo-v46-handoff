#!/usr/bin/env bash
# Android emulator helper for on-device-like testing of sakurayo.
# Usage: tools/emu.sh start|install <apk>|launch|shot <name>|tap x y|swipe x1 y1 x2 y2 [ms]|fps|stop
set -euo pipefail
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/workspace/android-sdk}"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
AVD="${EMU_AVD:-sakurayo_2400x1080}"
IMG="system-images;android-34;google_apis;x86_64"
PKG="${EMU_PKG:-}"
SHOTS="${EMU_SHOTS:-/workspace/sakurayo-shots/emulator}"
ADB="$ANDROID_SDK_ROOT/platform-tools/adb"
EMU="$ANDROID_SDK_ROOT/emulator/emulator"
LOG=/tmp/emu-$AVD.log

ensure_avd() {
  "$ANDROID_SDK_ROOT/emulator/emulator" -list-avds | grep -qx "$AVD" && return
  echo no | "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/avdmanager" create avd -n "$AVD" -k "$IMG" -d pixel_6 --force
  cfg="$HOME/.android/avd/$AVD.avd/config.ini"
  sed -i '/^hw.lcd\|^hw.ramSize\|^hw.gpu\|^hw.keyboard\|^disk.dataPartition/d' "$cfg"
  cat >> "$cfg" <<C
hw.lcd.width=1080
hw.lcd.height=2400
hw.lcd.density=400
hw.ramSize=3072
hw.gpu.enabled=yes
hw.gpu.mode=swiftshader_indirect
hw.keyboard=yes
disk.dataPartition.size=6G
C
}
pkg() { [ -n "$PKG" ] && { echo "$PKG"; return; }
  "$ADB" shell pm list packages | sed 's/package://' | grep -i sakura | head -1; }

case "${1:-}" in
  start)
    ensure_avd
    GPU="${EMU_GPU:-swiftshader_indirect}"
    # kvm group membership may not be active in this shell yet -> use sg
    nohup sg kvm -c "$EMU -avd $AVD -no-window -no-audio -no-boot-anim -no-snapshot -gpu $GPU -accel on" >"$LOG" 2>&1 &
    "$ADB" wait-for-device
    for i in $(seq 1 180); do
      [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ] && break; sleep 2; done
    "$ADB" shell settings put system accelerometer_rotation 0
    "$ADB" shell settings put system user_rotation 1
    echo "ready ($LOG)";;
  install) "$ADB" install -r -d "$2" || { "$ADB" uninstall "$(pkg)" || true; "$ADB" install "$2"; };;
  launch) "$ADB" shell monkey -p "$(pkg)" -c android.intent.category.LAUNCHER 1 >/dev/null;;
  shot) mkdir -p "$SHOTS"; "$ADB" exec-out screencap -p > "$SHOTS/$2.png"; echo "$SHOTS/$2.png";;
  tap) "$ADB" shell input tap "$2" "$3";;
  swipe) "$ADB" shell input swipe "$2" "$3" "$4" "$5" "${6:-300}";;
  fps) "$ADB" shell dumpsys gfxinfo "$(pkg)" | sed -n '/Total frames/,/99th/p';;
  stop) "$ADB" emu kill 2>/dev/null || true; pkill -f "qemu.*$AVD" 2>/dev/null || true; echo stopped;;
  *) sed -n 2,3p "$0"; exit 1;;
esac

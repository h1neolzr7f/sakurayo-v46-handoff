#!/usr/bin/env bash
# Boot the Pixel phone AVD, install YeYing debug APK, expose WebView CDP.
set -euo pipefail

SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}"
export ANDROID_SDK_ROOT="$SDK_ROOT"
export ANDROID_HOME="$SDK_ROOT"
export PATH="$SDK_ROOT/cmdline-tools/latest/bin:$SDK_ROOT/platform-tools:$SDK_ROOT/emulator:$PATH"

AVD_NAME="${AVD_NAME:-sakurayo_phone}"
APK="${APK:-/workspace/android-app/app/build/outputs/apk/debug/app-debug.apk}"
CDP_PORT="${CDP_PORT:-9222}"
LOG="/tmp/sakurayo-emulator.log"

if ! command -v adb >/dev/null; then
  echo "adb missing; run tools/setup_android_emulator.sh first" >&2
  exit 1
fi

if ! adb devices | awk 'NR>1 && $2=="device"{found=1} END{exit !found}'; then
  echo "Starting emulator $AVD_NAME on DISPLAY=${DISPLAY:-:1}"
  DISPLAY="${DISPLAY:-:1}" emulator -avd "$AVD_NAME" \
    -gpu swiftshader_indirect \
    -no-audio \
    -no-boot-anim \
    -netdelay none \
    -netspeed full \
    -accel on \
    >"$LOG" 2>&1 &
  echo $! > /tmp/sakurayo-emulator.pid
  echo "waiting for device..."
  adb wait-for-device
  for i in $(seq 1 90); do
    boot="$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
    if [[ "$boot" == "1" ]]; then
      break
    fi
    sleep 2
  done
fi

adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
adb shell settings put global stay_on_while_plugged_in 3 || true

if [[ -f "$APK" ]]; then
  adb install -r "$APK"
fi

adb shell am force-stop com.sakurayo.yeying.dev || true
adb shell am start -n com.sakurayo.yeying.dev/com.sakurayo.zombietide.MainActivity
sleep 4

pid=""
for i in $(seq 1 20); do
  pid="$(adb shell pidof com.sakurayo.yeying.dev | tr -d '\r' | awk '{print $1}')"
  if [[ -n "$pid" ]]; then
    break
  fi
  sleep 1
done
if [[ -z "$pid" ]]; then
  echo "YeYing process not found" >&2
  adb shell dumpsys activity activities | head -40
  exit 1
fi

adb forward --remove "tcp:${CDP_PORT}" 2>/dev/null || true
adb forward "tcp:${CDP_PORT}" "localabstract:webview_devtools_remote_${pid}"
echo "WEBVIEW_CDP=http://127.0.0.1:${CDP_PORT}"
echo "PID=$pid"
curl -fsS "http://127.0.0.1:${CDP_PORT}/json/version" || true
echo
echo "READY"

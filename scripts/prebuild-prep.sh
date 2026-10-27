#!/usr/bin/env bash
# Pre-build prep for EAS Android APK builds.
#
# Run BEFORE `eas build` to ensure no leftover state prevents the APK from
# installing. Common causes of "package appears to be invalid" that this
# script addresses:
#
#   1. Stale .expo/ cache from a previous build
#   2. Stale android/ folder from a previous `expo prebuild` (if it has
#      outdated config plugins baked in)
#   3. node_modules/ not matching the new package.json
#   4. metro cache stale
#
# Usage:
#   bash scripts/prebuild-prep.sh
#   eas build -p android --profile preview --non-interactive
#
# After the build finishes, download the APK and install it.
# IMPORTANT: uninstall any prior version of Hirely on your device first —
# a debug-signed build (from Expo Go dev client) cannot be installed over
# a release-signed APK, and vice versa.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Step 1: Cleaning .expo cache…"
rm -rf .expo/

echo "==> Step 2: Cleaning android/ folder (forces fresh prebuild)…"
# Only remove if it exists — if you have native code customizations, don't
# delete this; instead run `expo prebuild --clean` to regenerate.
if [ -d "android" ]; then
  rm -rf android/
  echo "    removed android/"
fi

echo "==> Step 3: Cleaning metro cache…"
rm -rf /tmp/metro-*
rm -rf $HOME/.cache/metro 2>/dev/null || true

echo "==> Step 4: Verifying package name in app.json…"
PKG=$(node -e "console.log(require('./app.json').expo.android.package)")
echo "    package: $PKG"
if [[ "$PKG" == *"_"* ]]; then
  echo "    ERROR: package name contains an underscore — Android may reject it."
  echo "    Change it to use only letters and dots, e.g. com.zeeshii07.hirely"
  exit 1
fi

echo "==> Step 5: Reinstalling deps (ensures lockfile matches package.json)…"
npm install

echo ""
echo "==> Pre-build prep complete. Next steps:"
echo ""
echo "  1. UNINSTALL any prior version of Hirely on your Android device."
echo "     (Settings → Apps → Hirely → Uninstall)"
echo ""
echo "  2. Build the APK:"
echo "     eas build -p android --profile preview --non-interactive"
echo ""
echo "  3. When the build finishes, download the .apk from the EAS URL"
echo "     and install it on your device."
echo ""
echo "  4. If install STILL fails with 'package appears to be invalid',"
echo "     try a development build profile instead:"
echo "     eas build -p android --profile development --non-interactive"

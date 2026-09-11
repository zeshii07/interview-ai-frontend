#!/usr/bin/env bash
# Nuclear repair script for interview-ai-frontend.
#
# This script does a FULL clean reinstall to eliminate all version drift.
# Use this if the previous patches didn't fully fix the errors.
#
# What it does:
#   1. Stops running Metro/Expo processes
#   2. Nukes ALL caches (node_modules, .expo, metro cache, haste map)
#   3. Reinstalls from the patched package.json
#   4. Runs `npx expo install --fix` to align remaining Expo packages
#   5. Verifies that Stack, Tabs, and router all resolve from expo-router
#   6. Verifies that expo-glass-effect and other critical deps are installed
#
# Usage (from the project root, AFTER applying the patched package.json):
#   bash ./scripts/repair.sh
set -e

echo "==> 1. Stopping any running Metro / Expo processes"
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
# Windows (Git Bash / WSL): also kill node processes holding the bundler port
pkill -f "node.*expo" 2>/dev/null || true

echo "==> 2. NUKING all caches and node_modules"
rm -rf node_modules
rm -rf package-lock.json
rm -rf .expo
rm -rf node_modules/.cache
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true
# Windows temp caches
rm -rf "$LOCALAPPDATA/Temp/metro-*" 2>/dev/null || true
rm -rf "$LOCALAPPDATA/Temp/haste-map-*" 2>/dev/null || true

echo "==> 3. Reinstalling dependencies from patched package.json"
npm install

echo "==> 4. Running 'npx expo install --fix' to align all Expo SDK packages"
# This is THE critical step. It bumps any Expo packages that are still
# mismatched with SDK 57. Without this, version drift persists.
npx expo install --fix

echo "==> 5. Verifying critical dependencies are installed"
for pkg in expo-glass-effect expo-symbols expo-modules-core @expo/log-box @expo/metro-runtime react-native-gesture-handler react-native-reanimated react-native-worklets react-native-screens; do
  if [ ! -d "node_modules/$pkg" ]; then
    echo "    -> MISSING: $pkg"
    echo "       Installing explicitly..."
    npm install "$pkg" --save
  else
    ver=$(node -e "console.log(require('$pkg/package.json').version)" 2>/dev/null || echo "unknown")
    echo "    -> OK: $pkg@$ver"
  fi
done

echo "==> 6. Verifying that expo-router now resolves Stack, Tabs, and router"
node -e "
const er = require('expo-router');
console.log('  expo-router version:', require('expo-router/package.json').version);
console.log('  router:', typeof er.router);
console.log('  useRouter:', typeof er.useRouter);
console.log('  useLocalSearchParams:', typeof er.useLocalSearchParams);

// Check the deprecated main entry exports
console.log('  --- main entry (deprecated) ---');
console.log('  Tabs (deprecated):', typeof er.Tabs);
console.log('  Stack (deprecated):', typeof er.Stack);

// Check the recommended direct paths
try {
  const tabs = require('expo-router/js-tabs');
  console.log('  --- expo-router/js-tabs ---');
  console.log('  Tabs:', typeof tabs.Tabs, '| default:', typeof tabs.default);
} catch (e) {
  console.log('  expo-router/js-tabs: FAILED -', e.message);
}
try {
  const stack = require('expo-router/js-stack');
  console.log('  --- expo-router/js-stack ---');
  console.log('  Stack:', typeof stack.Stack, '| default:', typeof stack.default);
} catch (e) {
  console.log('  expo-router/js-stack: FAILED -', e.message);
}
try {
  const stack = require('expo-router/stack');
  console.log('  --- expo-router/stack (native) ---');
  console.log('  Stack:', typeof stack.Stack, '| default:', typeof stack.default);
} catch (e) {
  console.log('  expo-router/stack: FAILED -', e.message);
}

// Check the critical native dep
try {
  const ge = require('expo-glass-effect');
  console.log('  --- expo-glass-effect ---');
  console.log('  isLiquidGlassAvailable:', typeof ge.isLiquidGlassAvailable);
  if (typeof ge.isLiquidGlassAvailable === 'function') {
    console.log('  isLiquidGlassAvailable():', ge.isLiquidGlassAvailable());
  }
} catch (e) {
  console.log('  expo-glass-effect: FAILED -', e.message);
}
"

echo
echo "==> 7. Verifying reanimated/worklets version alignment"
node -e "
const rn = require('react-native-reanimated/package.json').version;
const wl = require('react-native-worklets/package.json').version;
const sc = require('react-native-screens/package.json').version;
const gh = require('react-native-gesture-handler/package.json').version;
console.log('  react-native-reanimated:', rn);
console.log('  react-native-worklets:  ', wl);
console.log('  react-native-screens:   ', sc);
console.log('  react-native-gesture-handler:', gh);

const rnMinor = parseInt(rn.split('.')[1]);
const wlMinor = parseInt(wl.split('.')[1]);
let expectedWl;
if (rnMinor >= 6) expectedWl = '0.12';
else if (rnMinor === 5) expectedWl = '0.10';
else expectedWl = 'unknown';
console.log('  expected worklets minor for reanimated ' + rn + ':', expectedWl);
if (expectedWl !== 'unknown' && String(wlMinor) !== expectedWl.split('.')[1]) {
  console.error('  -> MISMATCH! Re-run with the patched package.json.');
  process.exit(1);
}
console.log('  -> OK: versions aligned.');
"

echo
echo "==> Done. Now start the dev server with a cleared cache:"
echo "    npx expo start -c"
echo
echo "If you still see errors, paste the FULL output of this script + the"
echo "first 30 lines of `npx expo start -c` output so we can diagnose further."

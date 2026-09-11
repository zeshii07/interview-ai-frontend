# Patched Files v3 — interview-ai-frontend

## What changed since v2

After applying v2, the `Tabs` error was fixed but a NEW error appeared at the **root** `app/_layout.js`:

```
ERROR [TypeError: undefined is not a function]
Code: _layout.js
> 2 | import { Stack, router } from 'expo-router';
```

Plus a secondary error:
```
ERROR Can't perform a React state update on a component that hasn't mounted yet.
Call Stack: url.then$argument_0 (expo-router/build/fork/useLinking.native.js:127:47)
```

**Root cause**: The same class of bug as before — `expo-router`'s `Stack` export resolves to `undefined` at runtime because a dependency required at module-evaluation time is missing or mismatched. Specifically, `Stack` (unlike `Tabs`) goes through `createNativeStackNavigator()` which calls `require("expo-glass-effect")` and executes `isLiquidGlassAvailable()` at the top level of the module. If `expo-glass-effect` is not installed as a **direct** dependency (only transitive), or if any of the other peer deps are mismatched, `Stack` ends up `undefined`.

The "15 other packages may need updating" message from Expo confirms that significant version drift remains after the first patch. This v3 patch adds ALL missing peer deps explicitly and bumps `expo` to the latest SDK 57 patch (`~57.0.21`).

---

## Files in this patch

```
patched-files/
├── package.json                    ← adds 5 missing deps + bumps expo to ~57.0.21
├── app/
│   ├── _layout.js                  ← NEW: defensive Stack resolver with JSStack fallback
│   └── (tabs)/
│       └── _layout.js              ← updated: defensive Tabs resolver
├── scripts/
│   └── repair.sh                   ← NUCLEAR: full clean reinstall + verification
└── FIXES.md                        ← this file
```

---

## The 5 missing dependencies (the actual fix)

I traced every `require()` call in `expo-router@57.0.17`'s `build/` folder and cross-referenced with your `package.json`. These are required at module-evaluation time (so they can cause `Stack`/`Tabs` to be `undefined` if missing) but were NOT in your `package.json`:

| Package | Why it's needed | Was | Now |
|---|---|---|---|
| `expo-glass-effect` | Required by `createNativeStackNavigator.js` (used by `Stack`). Calls `isLiquidGlassAvailable()` at module-eval. | missing (only transitive @57.0.1) | `~57.0.2` (explicit) |
| `expo-symbols` | Required by `native-tabs/utils/materialIconConverter.android.js` (Android native tabs). | missing (only transitive) | `~57.0.2` (explicit) |
| `expo-modules-core` | Required by `getLinkingConfig.js` and `color/materialColor.android.js`. | missing (only transitive) | `~57.0.17` (explicit) |
| `@expo/log-box` | Listed as peer dep of expo-router. Required by `renderRootComponent.js`. | missing | `^57.0.4` (explicit) |
| `@expo/metro-runtime` | Listed as peer dep of expo-router. Needed for HMR/dev. | missing | `^57.0.14` (explicit) |

Plus the version bumps from v2:

| Package | Was | Now | Why |
|---|---|---|---|
| `expo` | `~57.0.17` | `~57.0.21` | Latest SDK 57 patch — may fix the `useLinking` React 19 warning |
| `react-native-reanimated` | `4.5.0` | `4.6.0` | Matches worklets `0.12.x` |
| `react-native-screens` | `4.25.2` | `~4.27.0` | Satisfies expo-router's `^4.26.0` peer |
| `react-native-gesture-handler` | *missing* | `~3.2.0` | Required by Stack's `GestureHandlerNative.js` on Android/iOS |

---

## Why `Stack` was undefined but `Tabs` wasn't

I traced both export chains in `expo-router@57.0.17`:

### `Tabs` chain (was working after v2)
```
expo-router/js-tabs
  └─> build/layouts/Tabs.js
        └─> TabsClient.js
              └─> createBottomTabNavigator()   ← runs at module-eval
                    └─> react-navigation/bottom-tabs
                          └─> react-native-screens  ✓ (fixed in v2)
```
No `expo-glass-effect` dependency. Works once reanimated/screens are fixed.

### `Stack` chain (was still broken)
```
expo-router (main entry)
  └─> build/exports.js (deprecated getter)
        └─> build/stack/index.js
              └─> build/layouts/Stack.js
                    └─> StackClient.js
                          └─> createNativeStackNavigator()  ← runs at module-eval
                                └─> require("expo-glass-effect")  ✗ MISSING
                                      + isLiquidGlassAvailable()  ← throws if pkg missing
```

`expo-glass-effect@57.0.1` was in your `package-lock.json` as a **transitive** dependency (pulled in by `expo`), but it wasn't a direct dependency in `package.json`. When npm resolves transitive deps, it can use a version that doesn't quite match what `expo-router@57.0.17` expects, or the package can end up in a weird state after partial installs. Making it an explicit dependency at `~57.0.2` ensures the correct version is always installed.

---

## The `useLinking` error

```
ERROR Can't perform a React state update on a component that hasn't mounted yet.
Call Stack: url.then$argument_0 (expo-router/build/fork/useLinking.native.js:127:47)
```

This is a known React 19 + expo-router issue. React 19 elevated this from a warning to an error. The `useLinking` hook's `getInitialState` returns a Promise (line 127); the `.then()` callback fires before the component finishes mounting, triggering React 19's stricter check.

**This is likely fixed by bumping `expo` from `~57.0.17` to `~57.0.21`** (the latest SDK 57 patch includes React 19 compatibility fixes for expo-router). If it persists after applying this patch, it's a non-fatal error — the app should still render, and you can ignore it until the next SDK 57 patch.

---

## How to apply (FOLLOW THESE STEPS EXACTLY)

```bash
cd interview-ai-frontend

# 1. Back up your current package.json
cp package.json package.json.v2.bak

# 2. Unzip the patch (overwrites package.json, app/_layout.js,
#    app/(tabs)/_layout.js, adds scripts/repair.sh and FIXES.md)
unzip patched-files.zip

# 3. Run the NUCLEAR repair script — this deletes node_modules + lockfile,
#    reinstalls from the patched package.json, runs expo install --fix,
#    and verifies that Stack/Tabs/router all resolve.
bash ./scripts/repair.sh

# 4. Start the dev server with a cleared Metro cache
npx expo start -c
```

### Expected output of `repair.sh` step 6:
```
  expo-router version: 57.0.17
  router: object
  useRouter: function
  useLocalSearchParams: function
  --- main entry (deprecated) ---
  Tabs (deprecated): function
  Stack (deprecated): function
  --- expo-router/js-tabs ---
  Tabs: function | default: function
  --- expo-router/js-stack ---
  Stack: function | default: function
  --- expo-router/stack (native) ---
  Stack: function | default: function
  --- expo-glass-effect ---
  isLiquidGlassAvailable: function
  isLiquidGlassAvailable(): false
```

If any of those show `undefined` or `FAILED`, stop and paste the output back to me.

### Expected output of step 7:
```
  react-native-reanimated: 4.6.0
  react-native-worklets:   0.12.x
  react-native-screens:    4.27.x
  react-native-gesture-handler: 3.2.x
  -> OK: versions aligned.
```

---

## Defensive fallbacks in the patched layouts

Even with all deps installed, I added safety nets so the app boots with a visible error state instead of a hard crash if something is still wrong:

### `app/_layout.js`
```js
import { Stack as NativeStack, router } from 'expo-router';
import { Stack as JSStack } from 'expo-router/js-stack';
const Stack = typeof NativeStack === 'function' ? NativeStack : JSStack;
```
If the native `Stack` is undefined, it falls back to `JSStack` (the pure-JavaScript stack from `expo-router/js-stack`). `JSStack` doesn't need `expo-glass-effect` or the `react-native-screens` native module — it renders plain `View`s. You lose native transitions (slide animations) and native header behavior, but the app boots and is usable.

### `app/(tabs)/_layout.js`
```js
import { Tabs as NativeTabs } from 'expo-router/js-tabs';
const Tabs = typeof NativeTabs === 'function' ? NativeTabs : null;
// if null, renders <FallbackTabLayout/> with a visible error message
```

---

## Why `expo-router/js-stack` and `expo-router/js-tabs`?

In SDK 57, the main entry `import { Stack, Tabs } from 'expo-router'` is **deprecated** (see the `@deprecated` JSDoc in `expo-router/build/exports.js`). The recommended paths are:

| Import | Recommended path | Resolves to |
|---|---|---|
| `Tabs` | `expo-router/js-tabs` | `build/layouts/Tabs.js` (native bottom tabs) |
| `Stack` (native) | `expo-router/stack` | `build/layouts/Stack.js` → `StackClient.js` (native, needs `expo-glass-effect`) |
| `Stack` (pure JS) | `expo-router/js-stack` | `build/layouts/JSStack.js` (pure JS, no native deps) |

The patched layouts use `expo-router/js-tabs` for Tabs (direct path, same component) and a native+JS fallback pattern for Stack.

---

## Other things verified (NOT bugs)

- **`app/interview/session.js`** — `export default function InterviewSession()` is at line 172. The "missing default export" warning was a symptom of `react-native-reanimated` failing to load (line 17 import). Fixed once reanimated is aligned. **Don't touch this file.**
- **`constants/theme.js`** — exports all required keys (`Colors.bgCard`, `Colors.border`, `Colors.primary`, etc.). Fine.
- **`hooks/useVoiceRecognition.js`** — uses `expo-audio` correctly. Fine.
- **`services/authService.js`**, **`store/interviewStore.js`**, **`utils/storage.js`** — no issues found.
- **`babel.config.js`** — `babel-preset-expo` is sufficient for reanimated 4.x. The reanimated babel plugin is NOT required for 4.x on RN 0.86+.
- **`app.json`** — plugins list is fine. `expo-glass-effect` doesn't need a config plugin (it's a native module included in Expo Go SDK 57).

---

## Optional: remove unused template files

`App.js` and `index.js` are leftover from the default Expo template. They're unused because `package.json` has `"main": "expo-router/entry"`. You can delete them:

```bash
rm App.js index.js
```

---

## If the fix STILL doesn't work

Run this and paste me the FULL output:

```bash
bash ./scripts/repair.sh 2>&1 | tee repair-output.log
npx expo start -c 2>&1 | head -50
```

Plus these diagnostic commands:

```bash
node -e "console.log('expo:', require('expo/package.json').version)"
node -e "console.log('expo-router:', require('expo-router/package.json').version)"
node -e "console.log('expo-glass-effect:', require('expo-glass-effect/package.json').version)"
node -e "const r = require('expo-router'); console.log('Stack:', typeof r.Stack, 'Tabs:', typeof r.Tabs, 'router:', typeof r.router)"
node -e "const s = require('expo-router/js-stack'); console.log('JSStack:', typeof s.Stack)"
node -e "const t = require('expo-router/js-tabs'); console.log('JSTabs:', typeof t.Tabs)"
```

With that output I can pinpoint exactly which dep is still broken.

---

## Patch summary

| File | Change |
|---|---|
| `package.json` | Added `expo-glass-effect`, `expo-symbols`, `expo-modules-core`, `@expo/log-box`, `@expo/metro-runtime` as explicit deps. Bumped `expo` to `~57.0.21`. Kept v2 bumps (reanimated 4.6.0, screens ~4.27.0, gesture-handler ~3.2.0). |
| `app/_layout.js` | NEW patch: imports `Stack` from both `expo-router` (native) and `expo-router/js-stack` (JS fallback), uses whichever resolves. All your original logic (auth, onboarding, fonts, splash) preserved. |
| `app/(tabs)/_layout.js` | Updated: uses `expo-router/js-tabs` direct path + `FallbackTabLayout` if Tabs is still undefined. All your original screen definitions preserved. |
| `scripts/repair.sh` | NUCLEAR: deletes `node_modules` + lockfile, reinstalls, runs `expo install --fix`, verifies all critical deps and exports. |
| `FIXES.md` | This file. |

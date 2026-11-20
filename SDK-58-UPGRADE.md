# Fixing the Expo SDK 58 bundling errors

## What the errors mean

Your log has two kinds of output:

**1. The hundreds of WARN lines** — e.g.

```
The resolution for "...node_modules\react-native\asset-registry" defined in
"exports" is "...node_modules\react-native\asset-registry.js", however this
file does not exist. Falling back to file-based resolution.
```

Metro is reading `node_modules\react-native\package.json` and its `exports`
map points `./asset-registry`, `./setup-env` and `./unstable-internals-do-not-use`
to **top-level files** (`asset-registry.js` etc.) that do not exist on your disk.

**That mapping is not what any published react-native contains.** Every
published RN 0.87.x / 0.88.x (stable, RC, nightly — all verified) maps those
subpaths to `./src/*.js`, and those files ship in the package:

```json
"./asset-registry": { "default": "./src/asset-registry.js" },
"./setup-env": "./src/setup-env.js",
"./unstable-internals-do-not-use": { "default": "./src/unstable-internals-do-not-use.js" }
```

So your `node_modules\react-native` is in a **broken / mixed state**: either
the SDK 58 upgrade partially applied (a package.json from one state and files
from another), something interrupted `npm install` (antivirus / OneDrive /
a running Metro server locking files on Windows), or the file was edited by
hand during an earlier fix attempt.

**2. The final bundling failure** —

```
Unable to resolve "react-native/unstable-internals-do-not-use"
from "node_modules\expo\build\async-require\hmrUtils.native.js"
```

Expo 58's code legitimately imports that new React Native 0.88 subpath. In
your broken install it cannot resolve, so bundling fails and you never reach
the intro screens.

## The fix — clean reinstall (Windows)

Run this from `E:\interview-ai\client` in **PowerShell**:

```powershell
# 1. Stop the Metro dev server (Ctrl+C in its window) and close any
#    terminals/VS Code tasks running expo.

# 2. Delete the broken install state
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# 3. Verify the npm cache (fixes corrupted cache entries)
npm cache verify

# 4. Fresh install
npm install

# 5. Align every Expo package to SDK 58 (uses the versions verified in this repo)
npx expo install --fix

# 6. Validate the project
npx expo-doctor@latest

# 7. Start with a clean transform cache
npx expo start -c
```

(cmd.exe equivalent of step 2: `rmdir /s /q node_modules` then `del package-lock.json`)

If you unzipped the fixed project from this delivery, its `package.json` and
`package-lock.json` already contain the verified SDK 58 set — you can skip
step 5 and just run `npm install`.

> **Never edit files inside `node_modules` to "fix" errors.** Those edits are
> wiped by the next install and are exactly what produces warnings like these.

## Verified SDK 58 dependency set (used in this repo)

| Package | Version |
|---|---|
| expo | ^58.0.0 |
| react-native | 0.88.1 |
| react | 19.3.0 |
| expo-router | ~58.0.32 |
| react-native-reanimated | 4.7.1 |
| react-native-worklets | 0.13.0 |
| react-native-svg | 15.16.0 |
| react-native-view-shot | 6.1.1 |
| expo-audio | ~58.0.12 |

`npx expo install --fix` also added the `expo-font` config plugin to
`app.json` automatically.

## Important: rebuild the native app

SDK 58 upgrades React Native **0.86 → 0.88** — that is a native change. If
you test on a dev client or an installed APK, rebuild it:

```bash
npx expo run:android          # dev build on a connected device/emulator
# or
eas build --platform android --profile preview
```

Loading new JS into an APK built with SDK 57 will crash at startup for the
same "missing native module" reasons described in REBUILD.md.

## Code changes made in this repo for SDK 58

- `app/_layout.js`: removed the `backgroundColor` prop from the three
  `<StatusBar>` usages — RN 0.88 / expo-status-bar@58 removed that prop
  (`style="dark"` is kept; Android draws edge-to-edge now).
- `app.json`: `expo-font` added to plugins (by `expo install --fix`).
- `package.json` / `package-lock.json`: full SDK 58 alignment, regenerated
  from a clean install (no stale hoisted 57.x duplicates remain).

Verified after the upgrade: `npx expo export --platform android` bundles
cleanly (2002 modules, zero resolution warnings), `expo-doctor` passes, and
all 6 resume templates still generate correct PDF/DOCX (automated smoke
test).

## Two more SDK 58 changes to be aware of (no action needed now)

- **R8/minification is enabled by default for Android release builds.** If a
  release build ever strips something a library needs via reflection, add
  ProGuard keep rules or set `android.enableMinifyInReleaseBuilds: false` in
  the `expo-build-properties` plugin.
- **Removed RN APIs** (this app no longer uses any of them): 
  `InteractionManager`, the `animated` prop on `Modal`, `ImageBackground`
  (deprecated), and `StatusBar`'s `backgroundColor`/`translucent` props.

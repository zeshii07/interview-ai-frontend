# Why the app was crashing on launch — and how to fix it on your device

## Symptom

The app crashes immediately on launch, before the onboarding / intro screens
appear.

## Root causes found in the code

### 1. `react-native-worklets/plugin` was missing from babel.config.js

`react-native-reanimated` **v4** (which this app uses on the interview
session screen, the simulation overlay, and the celebration confetti)
**requires** the Babel plugin from the `react-native-worklets` package.
Without it, every worklet call crashes at runtime.

**Fixed:** the plugin is now registered in `babel.config.js`.

### 2. Native modules are imported at startup — an outdated APK build crashes instantly

Expo Router eagerly imports **every** file under `app/` when the app starts —
even screens you never open. Two of those files pull in libraries that touch
their **native module at import time**:

- `app/interview/session.js` → `hooks/useVoiceRecognition.js` → `expo-audio`
  runs `requireNativeModule('ExpoAudio')` at import time.
- `app/resume/preview.js` → `components/ui/ShareCard.js` →
  `react-native-view-shot` runs `TurboModuleRegistry.getEnforcing('RNViewShot')`
  at import time.

If your installed APK / dev client was built **before** these packages were
added to `package.json` (expo-audio, react-native-view-shot,
react-native-worklets, expo-glass-effect, ...), the JavaScript references a
native module that does not exist in the binary → the app dies during
startup, before any screen renders. This is the classic "crash before the
intro screens" after pulling new code.

**Fix (on your machine):** rebuild the native app and clear the Metro cache —
see the next section.

### 3. No ErrorBoundary was mounted

`components/ErrorBoundary.js` existed but was never used, so any render error
in a release build killed the whole app instead of showing a recovery screen.

**Fixed:** the root layout is now wrapped in the ErrorBoundary.

## How to run / rebuild after these changes

```bash
# 1. install the exact dependency tree
npm install        # or: npm ci

# 2. clear Metro's cache (stale transformed modules cause phantom crashes)
npx expo start -c

# For Expo Go development:
#   scan the QR code with Expo Go (SDK 57)

# For a development build on your machine:
npx expo run:android          # rebuilds the native app + installs it

# For a release APK via EAS:
eas build --platform android --profile production
```

If you use a **dev client or an installed APK**, you MUST rebuild it
(`npx expo run:android` or `eas build`) — a JS-only refresh is not enough
when native modules were added.

## Verified in this repo

- `npx expo export --platform android` bundles successfully with the new
  Babel config (full Metro bundle, the same pipeline a release build uses).
- All 6 resume templates render in both PDF and DOCX (automated smoke test),
  including the academic-photo template and a Unicode stress test
  (emoji / em dash / smart quotes / Urdu).

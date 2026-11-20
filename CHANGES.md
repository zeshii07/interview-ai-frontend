# Changelog — bug fixes in this update

## 1. Startup crash fixes

| # | Fix | Files |
|---|-----|-------|
| 1.1 | Added `react-native-worklets/plugin` to the Babel config. Reanimated v4 hard-requires it; without it every animated screen (interview session, simulation overlay, celebration confetti) crashes at runtime. | `babel.config.js` |
| 1.2 | Wrapped the root layout in the (previously unused) `ErrorBoundary`, so a render error shows a recovery card instead of killing the app. | `app/_layout.js` |
| 1.3 | Removed the leftover blank-template entry files `App.js` and root `index.js`. The real entry is `expo-router/entry` (set in `package.json`); the dead files only caused confusion and could shadow the router entry in some tooling. | `App.js`, `index.js` (deleted) |
| 1.4 | Replaced the non-standard `expo-router/stack` + `expo-router/js-stack` imports with the canonical `import { Stack, router } from 'expo-router'`. | `app/_layout.js` |
| 1.5 | Removed the premature `router.replace('/(tabs)')` from onboarding finish — it fired while no navigator was mounted ("action not handled by any navigator"). The root layout already decides what renders after onboarding. | `app/(auth)/onboarding.js` |
| 1.6 | Applied the WinAnsi sanitizer that `FIXES.md` documented but that was never actually committed. Downloading a resume PDF crashed with `WinAnsi cannot encode "—"` / `"•"` / emoji for any resume containing em dashes, smart quotes, bullets or emoji. Now sanitized in `safeText()` (all text flows through it) **and** as a last line of defense in `ResumeCanvas.drawText()`. | `services/localResumePdf.js` |

See `REBUILD.md` for the remaining environment cause of startup crashes
(installed APK older than the current JS) and how to rebuild.

## 2. UI consistency fixes

| # | Fix | Files |
|---|-----|-------|
| 2.1 | Tab bar: imported `Tabs` from the main `expo-router` entry and removed the dead-end "fallback mode" screen that could be shown to end users. | `app/(tabs)/_layout.js` |
| 2.2 | Deleted three stale duplicate routes that expo-router still registered as extra, icon-less tabs in the tab bar: `(tabs)/history.js`, `(tabs)/practice.js`, `(tabs)/questions.js` (the live screens are `/interview/history`, `/interview/practice` and the root `/questions`). | `app/(tabs)/*` (deleted) |
| 2.3 | `components/ui/Card.js` accidentally contained a copy of `ShareCard`, which ignores `children`/`style`/`padding` — so the Question Bank rendered a share-image card instead of the questions. Replaced with the intended generic card component (supports `padding`, `variant="error"`, `onPress`). | `components/ui/Card.js` |
| 2.4 | Fixed the invalid `backgroundImage` style prop (silently ignored by React Native, so gradient CTAs rendered flat) → `experimental_backgroundImage`, matching the theme. | `components/ui/Button.js`, `app/(tabs)/index.js`, `app/(tabs)/profile.js`, `app/settings/edit-profile.js` |
| 2.5 | Retinted the legacy off-brand purple palette (#7047F5 / #5330DB / #169B70 / #C77A19 / #3478F6 / #6541F5) to the design-system tokens (Colors.primary / primaryDark / success / warning / info / textMuted) so all screens share the same indigo-violet identity. | `app/interview/session.js`, `app/resume/analyze.js`, `app/(auth)/login.js`, `components/ui/interview-simulation-overlay.js` |
| 2.6 | Removed 169 lines of commented-out dead code above the live onboarding implementation. | `app/(auth)/onboarding.js` |
| 2.7 | Deleted the duplicated nested directories `services/services/`, `hooks/hooks/`, `utils/utils/` (nothing imported them; they were dead weight and a confusion hazard). | (deleted) |

## 3. CV template consistency fixes

| # | Fix | Files |
|---|-----|-------|
| 3.1 | New single source of truth for the 6 resume templates: UI metadata (name, icon, badge) **and** the document color tokens used by the PDF and DOCX renderers. | `constants/resumeTemplates.js` (new) |
| 3.2 | The template picker previously showed brand colors that had nothing to do with the produced documents (e.g. "Modern" card was blue #245FC7 while its PDF is navy #17365D, "Executive" was orange while its PDF is ink-blue). The picker, preview and documents now all read the same tokens. | `app/resume/generator.js`, `services/localResumePdf.js`, `services/localResumeDocx.js` |
| 3.3 | The resume preview rendered one generic layout regardless of the chosen template, so the download never matched the preview. The preview now styles itself per template: header alignment (left/center), section-heading style (classic rule / navy band / blue rule / accent bar / centered academic rule), template ink/muted colors, target-role line, academic personal-details line, and the photo top-right for the academic-photo template. A caption names the template so users know the download matches. | `app/resume/preview.js` |

## Verification

- `npx expo export --platform android` — full Metro bundle compiles cleanly
  with the new Babel config.
- Automated smoke test (Node): all 6 templates generate valid PDFs (valid
  `%PDF-` header, correct accent colors) and DOCX output containing the
  template accent + name; academic-photo with an embedded photo works; a
  Unicode stress input (smart quotes, em dash, ×, emoji, Urdu) no longer
  crashes the PDF generator.
- No remaining references to deleted files (`grep` for the deleted import
  paths returns nothing).

## 4. Expo SDK 58 upgrade (this delivery)

Upgraded the project to Expo SDK 58 (React Native 0.86 → 0.88, React 19.3)
using the official path and fixed everything the upgrade required:

| # | Change | Files |
|---|--------|-------|
| 4.1 | `expo` → `^58.0.0`, `react-native` → `0.88.1`, `expo-router` → `~58.0.32`, `react-native-reanimated` → `4.7.1`, `react-native-worklets` → `0.13.0`, `react-native-svg` → `15.16.0`, `react-native-view-shot` → `6.1.1`, `expo-audio` → `~58.0.12`, `@expo/metro-runtime` → `~58.0.17`, plus all other Expo packages aligned via `npx expo install --fix`. | `package.json`, `package-lock.json` |
| 4.2 | Removed `@expo/log-box` from direct dependencies — it is a transitive dependency of expo itself, and pinning 57.x pulled `@expo/dom-webview@57` into the tree next to the 58.x copies (expo-doctor "duplicate native modules" failure). Everything now resolves to a single 58.x version. | `package.json` |
| 4.3 | Removed the `backgroundColor` prop from the three `<StatusBar>` usages — removed in RN 0.88 / expo-status-bar 58. | `app/_layout.js` |
| 4.4 | `expo-font` config plugin added to `app.json` (done automatically by `expo install --fix`). | `app.json` |
| 4.5 | Full clean reinstall performed (node_modules + lockfile deleted and regenerated) so the committed `package-lock.json` contains no stale 57.x hoists. | `package-lock.json` |

Verified on SDK 58 after the upgrade: `npx expo export --platform android`
bundles cleanly (2002 modules, zero `exports` resolution warnings),
`npx expo-doctor` passes all checks, and all resume template smoke tests
still pass. See `SDK-58-UPGRADE.md` for why your local machine showed
"Unable to resolve react-native/unstable-internals-do-not-use" and the exact
clean-reinstall steps to fix it.

## 5. Tools screen, document preview, and download fixes (this delivery)

Four user-reported bugs, all fixed and verified.

### 5.1 Inconsistent tool cards (Home + Tools screens)

**Root cause:** the tool list was duplicated in `app/(tabs)/index.js` and
`app/(tabs)/tools.js` with different names, descriptions and states. The
worst case: "Mock Interview" was a dead *Coming soon* card on Home while
"AI Mock Interview" was a fully working featured card on Tools. On top of
that, `ToolCard` used a fixed `height: 148` that clipped the "Coming soon"
badge and the second description line, and carried a `backgroundImage`
style that React Native silently ignores.

**Fix:**
- New `constants/tools.js` — single source of truth for every tool
  (id, canonical title, two-line Home title, description, icon, route,
  category, featured/comingSoon flags). Both screens render from it.
- Home now shows a working "AI Mock Interview" card; coming-soon is
  reserved for genuinely unreleased tools (AI Coach, Salary Insights).
- `ToolCard` reworked: `minHeight` instead of fixed height (uniform
  because every card renders the same 3 rows — icon row, 2-line title,
  2-line description), the coming-soon chip moved into the icon row (out
  of the text flow), and the invalid `backgroundImage` replaced with the
  same flat-indigo + overlay treatment `GradientHero` uses.

### 5.2 No full template preview after CV optimization

**Root cause:** the "Review Resume" screen was an *editor* (text inputs in
a white card), not a document view — users had no way to see how the
downloaded CV would actually look (pagination, section bands, skill chips,
photo placement, footers).

**Fix — a true WYSIWYG document preview:**
- `services/localResumePdf.js` refactored: the entire render flow now
  lives in one internal `renderResumeDocument(doc, resume)` function, and
  runs against either a real pdf-lib document or a new **recording
  document** that captures every drawText / drawLine / drawRectangle /
  drawCircle / drawImage call. New export `buildResumePdfLayout(resume)`
  returns the pages of draw operations.
- New `components/resume/PdfDocumentPreview.js` paints those operations
  as React Native views at exact A4 proportions (text at the PDF's own
  font metrics and positions, section bands, skill chips, bullet dots,
  contact icons, photo, page footers).
- The Review screen now opens in **"Document preview"** mode (this is
  exactly how your PDF will look) with a segmented switch to **"Edit
  wording"** (the old editor). Edits rebuild the preview automatically
  (debounced).

**Verification:** the recorded layout was compared against the PDF's own
content stream for all templates — identical text-op counts, identical
(x, y) coordinates (precision = recall = 1.000) and identical string
sequence; page counts match the PDF exactly (including multi-page
resumes); rasterized side-by-side row-band comparison matches within a
sub-pixel mean offset.

### 5.3 App restarted when tapping the PDF button

**Root cause:** the download pipeline wrote files with the *new*
expo-file-system File API (`new File(...).write(uint8)`) — which has
native crash reports on some SDK versions and was the only untested leg of
the PDF path (the DOC path used the same writer, but PDFs are the larger
binary). Its fallback was doubly broken in SDK 58: `writeAsStringAsync`
imported from the main `expo-file-system` entry **throws at runtime**
(SDK 54+ stub), and it called an **undefined `bytesToBase64`** function.
Additionally pdf-lib's default `save()` uses object-stream serialization
(the pako flate path), the most fragile part of pdf-lib on Hermes.

**Fix (`services/resumeDownload.js` rewritten):**
- Primary write path is now the battle-tested legacy API
  (`expo-file-system/legacy` → `writeAsStringAsync` + base64), with the
  new File API kept only as a fallback.
- New pure-JS chunked `bytesToBase64()` (`utils/bytes.js`) — no missing
  functions, no call-stack overflow on large documents.
- pdf-lib now saves with `useObjectStreams: false` (classic xref table —
  a few KB larger, far more compatible).
- `app/interview/report.js` had the same broken import
  (`writeAsStringAsync` from the main entry + `cacheDirectory` being
  undefined there) — fixed to import from `expo-file-system/legacy`.

### 5.4 Word download: "Save / Share" saved nothing

**Root cause:** the Word document (a Word-HTML `.doc`) was shared with
mismatched metadata, and the only save mechanism was the system share
sheet — if the picked target rejected the file, it silently went nowhere.
The pre-alert ("Choose Save / Share…") also made the flow confusing.

**Fix:**
- Correct MIME type for the `.doc` file (`application/msword`, UTI
  `com.microsoft.word.doc`).
- On Android the user now chooses between **"Save to Downloads"** — a
  Storage Access Framework folder picker that writes the file directly
  into a user-visible folder (with a confirmation alert afterwards) — and
  **"Share a copy"** (the share sheet). On iOS the share sheet opens
  directly (it contains "Save to Files").
- If the folder picker is dismissed, the code falls back to the share
  sheet so the file is never left in limbo.

### Verification for this section

- `npx expo export --platform android` — bundles cleanly with all changes
  (2009 modules).
- Resume smoke suite: all 6 templates generate valid PDFs (classic xref,
  no object streams) and Word docs; layout preview tests pass for all
  templates (A4 geometry, page-count agreement with the PDF, footer on
  every page, photo captured as an image op, unicode stress).
- `npx expo-doctor` — 20/20 checks passed.


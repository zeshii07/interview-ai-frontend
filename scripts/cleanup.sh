#!/usr/bin/env bash
# Frontend dead-code cleanup.
#
# Removes files & dead-comment blocks that are NOT used by the app:
#   - App.js                          (legacy Expo template; main is expo-router/entry)
#   - index.js                        (legacy Expo template — same)
#   - src/                            (backend-shaped folder leftover from a botched
#                                      merge; no frontend file imports from it)
#   - leading dead-comment blocks in  (commented-out duplicates of the screen,
#     app/(tabs)/history.js            left from previous refactors)
#     app/(tabs)/practice.js
#
# Run from the project root (the folder containing package.json):
#
#   bash scripts/cleanup.sh
#
# Safe to re-run — exits 0 if the files are already gone.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Removing legacy template files (App.js, index.js)…"
rm -f App.js index.js

echo "==> Removing dead src/ folder (backend-shaped leftover, never imported)…"
# Sanity-check: refuse to delete if any frontend source imports from src/
if grep -rn "from '\.\./src\|from '\.\./\.\./src\|from '~/src" app components services store utils hooks 2>/dev/null; then
  echo "ERROR: refusing to delete src/ — at least one frontend file imports from it (see above)."
  echo "       Inspect those imports before deleting."
  exit 1
fi
rm -rf src/

echo "==> Stripping leading dead-comment blocks from history.js & practice.js…"
# Both files start with the entire previous version of the file commented out
# (lines 1..177 in history.js, lines 1..27 in practice.js). Use python to
# safely strip the leading comment block up to the first non-comment,
# non-blank line.
python3 - <<'PY'
import re, os

for path in ["app/(tabs)/history.js", "app/(tabs)/practice.js"]:
    if not os.path.exists(path):
        print(f"  skip: {path} (not found)")
        continue
    with open(path, "r", encoding="utf-8") as f:
        src = f.read()

    lines = src.split("\n")
    # Find the first line that's neither blank, nor a `//`-comment, nor a `/*`/`*/` block-comment
    first_real = None
    in_block = False
    for i, ln in enumerate(lines):
        stripped = ln.strip()
        if in_block:
            if "*/" in stripped:
                in_block = False
            continue
        if not stripped:
            continue
        if stripped.startswith("//"):
            continue
        if stripped.startswith("/*"):
            if "*/" not in stripped[2:]:
                in_block = True
            continue
        first_real = i
        break

    if first_real is None or first_real == 0:
        print(f"  skip: {path} (no leading comment block found)")
        continue

    cleaned = "\n".join(lines[first_real:])
    with open(path, "w", encoding="utf-8") as f:
        f.write(cleaned)
    print(f"  stripped {first_real} leading comment lines from {path}")
PY

echo ""
echo "Cleanup complete."
echo "Note: package.json is unchanged — these deletions don't require any dep changes."

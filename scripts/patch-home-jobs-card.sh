#!/usr/bin/env bash
# Patch app/(tabs)/index.js — adds a "Find Jobs" card to the `tools` array
# (inserted as the SECOND entry so it appears right under the featured
# Resume Generator). Idempotent: skips if already present.
#
# Run from the frontend project root:
#   bash scripts/patch-home-jobs-card.sh
set -euo pipefail

cd "$(dirname "$0")/.."

FILE="app/(tabs)/index.js"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found. Run this script from the frontend project root."
  exit 1
fi

if grep -q "Find Jobs\|route: '/(tabs)/jobs'\|route: '/jobs'" "$FILE"; then
  echo "==> 'Find Jobs' card already present in $FILE — skipping."
  exit 0
fi

echo "==> Patching $FILE to add the 'Find Jobs' card…"

# Use python3 for safe multi-line insertion. We insert the new card right
# after the opening of the `tools = [` array, so it shows up first (before
# the Resume Generator) — Jobs is the new flagship feature.
python3 - <<'PY'
import io, os, sys, re

path = "app/(tabs)/index.js"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

new_card = """  {
    title: 'Find\\nJobs',
    description: 'Search across the web',
    icon: 'briefcase-outline',
    route: '/jobs',
    featured: true,
  },
"""

# Insert right after `const tools = [\n`
m = re.search(r"(const\s+tools\s*=\s*\[\n)", src)
if not m:
    print("ERROR: could not find `const tools = [` in", path, file=sys.stderr)
    sys.exit(1)

idx = m.end()
patched = src[:idx] + new_card + src[idx:]

with open(path, "w", encoding="utf-8") as f:
    f.write(patched)

print("Inserted 'Find Jobs' card at the top of the tools array.")
PY

echo ""
echo "==> Done. Verify by running:"
echo "    grep -A 6 \"Find\\\\nJobs\" '$FILE'"

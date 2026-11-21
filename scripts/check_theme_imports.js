#!/usr/bin/env node
/**
 * check_theme_imports.js — static guard against undefined theme tokens.
 *
 * Motivation: a patch once replaced a file's theme import line
 * (`Shadows` -> `Elevation`) while a `...Shadows.small` usage survived in
 * the same file. Metro happily bundles it (it never executes module code),
 * and the app crashes at runtime with
 *   ReferenceError: Property 'Shadows' doesn't exist
 * plus misleading "Route ... missing the required default export" warnings
 * for every route that transitively imports the broken module.
 *
 * This script statically finds that class of bug before it ships: for every
 * .js file under app/ and components/, any usage of a theme token
 * (Token.foo) must be covered by that token appearing in an import from
 * constants/theme (single-line or multi-line import).
 *
 * Usage:  node scripts/check_theme_imports.js
 * Exit 0 = clean, exit 1 = violations listed on stdout.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['app', 'components'];
const THEME_TOKENS = [
  'Colors', 'Gradients', 'Spacing', 'FontSizes', 'Radius',
  'Shadows', 'Typography', 'Elevation', 'Glass',
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_deprecated') continue;
      walk(full, files);
    } else if (entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

function collectFiles() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const abs = path.join(ROOT, dir);
    if (fs.existsSync(abs)) files.push(...walk(abs));
  }
  return files;
}

/** Extract the import statement (if any) that pulls from constants/theme. */
function themeImportSource(source) {
  const m = source.match(/import\s+\{([^}]*)\}\s+from\s+['"][^'']*constants\/theme['"];?/);
  return m ? m[1] : '';
}

function checkFile(file) {
  const source = fs.readFileSync(file, 'utf8');
  const imported = themeImportSource(source);
  const importedTokens = new Set(
    imported.split(',').map((t) => t.trim()).filter(Boolean)
  );

  const violations = [];
  for (const token of THEME_TOKENS) {
    // Usage = "Token." followed by an identifier char (e.g. Shadows.small,
    // Colors.primary). Spread in styles (...Shadows.small) counts too.
    const uses = new RegExp(`\\b${token}\\s*\\.\\s*[A-Za-z_]`).test(source);
    if (uses && !importedTokens.has(token)) {
      violations.push(token);
    }
  }
  return violations;
}

function main() {
  const files = collectFiles();
  let bad = 0;
  for (const file of files) {
    const violations = checkFile(file);
    if (violations.length > 0) {
      bad += 1;
      const rel = path.relative(ROOT, file);
      console.log(`✗ ${rel}`);
      for (const token of violations) {
        console.log(`    uses \`${token}.\` but does not import it from constants/theme`);
      }
    }
  }
  if (bad > 0) {
    console.log(`\n${bad} file(s) with undefined theme token references.`);
    console.log('These crash at RUNTIME (Metro will still bundle them).');
    process.exit(1);
  }
  console.log(`✓ ${files.length} files scanned — all theme token usages are imported.`);
}

main();

#!/usr/bin/env bash
# Extracts inter-package dependency edges from backend/src/main/java/com/applyiq/**.
# Output: one "pkgA -> pkgB" edge per line (deduped, self-loops removed).
set -uo pipefail

ROOT="${1:-backend/src/main/java/com/applyiq}"

if [ ! -d "$ROOT" ]; then
  echo "No such directory: $ROOT" >&2
  exit 1
fi

find "$ROOT" -name '*.java' | while read -r file; do
  # package is the directory path relative to .../com/applyiq/, top-level segment only
  rel="${file#"$ROOT"/}"
  pkg="${rel%%/*}"
  [ -d "$ROOT/$pkg" ] || continue  # file directly in $ROOT, not a package

  (grep -oE '^import com\.applyiq\.[a-zA-Z0-9_.]+;' "$file" 2>/dev/null || true) | \
    sed -E 's/^import com\.applyiq\.([a-zA-Z0-9_]+)\..*/\1/' | \
    while read -r target; do
      if [ "$target" != "$pkg" ]; then
        echo "$pkg -> $target"
      fi
    done
done | sort -u

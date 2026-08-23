#!/usr/bin/env bash
# Extracts inter-module dependency edges from frontend/src/**, based on the
# `@/...` path-alias imports (alias -> frontend/src, see frontend/tsconfig*.json).
# Modules are frontend/src's top-level dirs, with components/* split into its
# own subdirs (ui, app, layout, sections) since they have very different roles.
# Output: one "moduleA -> moduleB" edge per line (deduped, self-loops removed).
set -uo pipefail

ROOT="${1:-frontend/src}"

if [ ! -d "$ROOT" ]; then
  echo "No such directory: $ROOT" >&2
  exit 1
fi

module_of() {
  # $1 = path relative to frontend/src, e.g. pages/dashboard-page.tsx
  local rel="$1"
  case "$rel" in
    components/*/*) echo "${rel%%/*}/$(echo "$rel" | cut -d/ -f2)" ;;
    */*) echo "${rel%%/*}" ;;
    *) echo "$rel" ;;
  esac
}

find "$ROOT" -type f \( -name '*.ts' -o -name '*.tsx' \) | while read -r file; do
  rel="${file#"$ROOT"/}"
  src_module="$(module_of "$rel")"

  (grep -oE "from ['\"]@/[a-zA-Z0-9_/-]+['\"]" "$file" 2>/dev/null || true) | \
    sed -E "s/from ['\"]@\/([a-zA-Z0-9_/-]+)['\"]/\1/" | \
    while read -r target_path; do
      target_module="$(module_of "$target_path")"
      if [ "$target_module" != "$src_module" ]; then
        echo "$src_module -> $target_module"
      fi
    done
done | sort -u

#!/usr/bin/env bash
# project-map scan — maintain a file+hash manifest for cheap structural-drift
# detection. The semantic graph (.claude/project-graph.json) is model-owned;
# this script owns .claude/project-graph.manifest and only ever READS source.
#
#   scan.sh snapshot   re-baseline the manifest from the current tree
#   scan.sh check      diff tree vs manifest (exit 2 = structural, 1 = content, 0 = in sync)
#   scan.sh list       print the current file+hash list to stdout
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd))"
MANIFEST="$ROOT/.claude/project-graph.manifest"
TAB=$'\t'

hash_file() {
  if command -v sha1sum >/dev/null 2>&1; then sha1sum "$1" | awk '{print $1}'
  else shasum -a 1 "$1" | awk '{print $1}'; fi
}

# Emit "path<TAB>hash" for every tracked source + key config file, sorted by path.
current_list() {
  cd "$ROOT"
  {
    find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) 2>/dev/null || true
    find src-tauri/src -type f -name '*.rs' 2>/dev/null || true
    for f in next.config.ts package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml; do
      [ -f "$f" ] && printf '%s\n' "$f"
    done
  } | sort -u | while IFS= read -r f; do
      printf '%s%s%s\n' "$f" "$TAB" "$(hash_file "$f")"
    done
}

cmd="${1:-check}"
case "$cmd" in
  snapshot)
    current_list > "$MANIFEST"
    printf 'Wrote %s entries to %s\n' "$(wc -l < "$MANIFEST" | tr -d ' ')" "${MANIFEST#"$ROOT"/}"
    ;;
  list)
    current_list
    ;;
  check)
    if [ ! -f "$MANIFEST" ]; then
      echo "NO_MANIFEST — run: scan.sh snapshot"; exit 2
    fi
    cur="$(mktemp)"; cur_p="$(mktemp)"; man_p="$(mktemp)"
    trap 'rm -f "$cur" "$cur_p" "$man_p"' EXIT
    current_list > "$cur"
    cut -f1 "$cur" | sort > "$cur_p"
    cut -f1 "$MANIFEST" | sort > "$man_p"
    added="$(comm -23 "$cur_p" "$man_p")"
    removed="$(comm -13 "$cur_p" "$man_p")"
    changed=""
    while IFS= read -r p; do
      [ -z "$p" ] && continue
      hc="$(grep -F -m1 "${p}${TAB}" "$cur" | cut -f2)"
      hm="$(grep -F -m1 "${p}${TAB}" "$MANIFEST" | cut -f2)"
      [ "$hc" != "$hm" ] && changed="${changed}${p}\n"
    done < <(comm -12 "$cur_p" "$man_p")

    structural=0; content=0
    [ -n "$added" ]   && { echo "ADDED:";   printf '%s\n' "$added"   | sed 's/^/  + /'; structural=1; }
    [ -n "$removed" ] && { echo "REMOVED:"; printf '%s\n' "$removed" | sed 's/^/  - /'; structural=1; }
    [ -n "$changed" ] && { echo "CHANGED:"; printf "$changed"        | sed 's/^/  ~ /'; content=1; }

    if [ "$structural" -eq 1 ]; then
      echo "STRUCTURAL_DRIFT — files added/removed; .claude/project-graph.json is stale. Update it, then: scan.sh snapshot"
      exit 2
    elif [ "$content" -eq 1 ]; then
      echo "CONTENT_DRIFT — file contents changed; refresh the graph node if its role/symbols changed, then: scan.sh snapshot"
      exit 1
    else
      echo "IN_SYNC"; exit 0
    fi
    ;;
  *)
    echo "usage: scan.sh [check|snapshot|list]" >&2; exit 64
    ;;
esac

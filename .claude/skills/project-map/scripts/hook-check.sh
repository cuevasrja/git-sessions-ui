#!/usr/bin/env bash
# PostToolUse hook: after a Write/Edit, check whether the project structure has
# drifted from the last project-graph snapshot. On structural drift, inject a
# reminder for the model via additionalContext. Read-only; never writes.
set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || true)}"
[ -z "$ROOT" ] && exit 0
SCAN="$ROOT/.claude/skills/project-map/scripts/scan.sh"
[ -x "$SCAN" ] || exit 0

out="$("$SCAN" check 2>/dev/null || true)"
if printf '%s' "$out" | grep -q 'STRUCTURAL_DRIFT'; then
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Project structure changed since the last project-graph snapshot (a source file was added or removed). Update .claude/project-graph.json to reflect it, then run .claude/skills/project-map/scripts/scan.sh snapshot to re-baseline. Run scan.sh check for the exact file list."}}\n'
fi
exit 0

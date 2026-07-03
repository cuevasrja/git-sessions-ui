---
name: project-map
description: Token-saving project index for GitSessionManager. Use it to locate code cheaply — read the graph at .claude/project-graph.json BEFORE reaching for Grep/Glob — and to keep that graph in sync after structural changes. Invoke as /project-map with an optional mode: `query <question>`, `update`, `build`, or `check`. Also invoke proactively when the PostToolUse hook reports structural drift.
---

# project-map

`.claude/project-graph.json` is a graph index of this repo: `nodes` map every
source file to its role, key symbols, and edges; `flows` capture the cross-cutting
chains (the four-sided IPC contract, the create/edit/delete/keygen flows, styling,
keyboard); `commands` is the IPC command lookup table. Reading it costs far fewer
tokens than grepping the tree and reading multiple files.

Its manifest sibling `.claude/project-graph.manifest` (owned by `scripts/scan.sh`)
tracks file hashes so structural drift is detectable cheaply.

## Modes

Read the argument after `/project-map`. Default: `query` if a question follows,
otherwise `check`.

### query <question> — locate code cheaply (the common case)
1. Read `.claude/project-graph.json`.
2. Answer from `nodes` (role/symbols/edges), `flows`, and the `commands` table.
   Return concrete `path` values, plus the relevant flow when the question spans
   the Rust↔TS boundary.
3. Fall back to Grep/Glob **only** when the graph genuinely doesn't answer. If you
   find something the graph missed or got wrong, fix the graph (see `update`) so
   the next search is cheap.

### check — detect drift
Run `.claude/skills/project-map/scripts/scan.sh check`. It prints
ADDED/REMOVED/CHANGED files vs the last snapshot and exits `2` on structural drift
(files added/removed → graph stale), `1` on content-only drift, `0` in sync.

### update — incremental refresh (after a structural change)
1. `scan.sh check` to see what moved.
2. For each **ADDED** file: add a node (`path`, one-line `role`, key `symbols`,
   `tags`, `edges`) and slot it into any relevant `flow`/`commands` entry.
   For each **REMOVED** file: delete its node and prune edges/flows referencing it.
   For a **CHANGED** file whose responsibility or key symbols changed: update that node.
3. Re-baseline: `scan.sh snapshot`.

### build — full regenerate (first-time or after a big refactor)
Enumerate `scan.sh list`, read each file enough to state its one-line role + key
exported symbols, capture edges (imports, IPC command strings, type mirrors,
backup/dry_run relationships) and the flows, write `.claude/project-graph.json`,
then `scan.sh snapshot`.

## Rules
- The graph is the FIRST place to look; Grep/Glob is the fallback, not the default.
  This is the whole point — it's how the search stays cheap.
- Keep node `role`s to one line. Never paste code into the graph.
- After ANY change that adds, moves, or removes a source file — or changes what a
  module is responsible for — update the graph and run `scan.sh snapshot`. A stale
  map silently sends future searches to the wrong place, which is worse than none.
- When the `PostToolUse` hook injects a structural-drift reminder, run `update`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GitSessionManager — a Tauri v2 desktop app (Rust backend + Next.js/TypeScript frontend) that manages multiple Git identities/SSH sessions. It keeps three easily-desynced sources of truth in lockstep:

1. `~/.gitconfig.<name>` — per-identity Git config
2. `[includeIf "gitdir:…"]` folder bindings in `~/.gitconfig`
3. `Host` blocks in `~/.ssh/config`

and surfaces correlation problems between them (orphaned `includeIf`, uncorrelated `Host`, missing `IdentityFile`) as health/warnings in the UI.

## Next.js version warning

This project uses Next.js 16, which has breaking changes vs. older training data (APIs, conventions, file structure may differ). Before relying on remembered Next.js behavior, check `node_modules/next/dist/docs/` for the current guide, particularly `01-app/02-guides/static-exports.md` for how this project's static export is configured.

## Project map — search here first

`.claude/project-graph.json` is a token-saving graph index of the whole repo: every source file mapped to its role, key symbols, and relationships, plus the cross-cutting flows (the four-sided IPC contract, the create/edit/delete/keygen flows, the styling and keyboard conventions) and an IPC `commands` lookup table. **Before using Grep/Glob or reading several files to find where something lives, read this graph first** — it usually answers "where is X" in one cheap read. Fall back to Grep/Glob only when the graph misses, and when it does, add what you found so the next search stays cheap.

After adding, moving, or deleting a source file — or changing what a module is responsible for — update `.claude/project-graph.json` and re-baseline with `.claude/skills/project-map/scripts/scan.sh snapshot`. A `PostToolUse` hook (in `.claude/settings.json`) runs `scan.sh check` after edits and injects a reminder when the structure has drifted. The `/project-map` skill automates the query/update/build/check modes.

## Commands

```bash
# Frontend only, in a browser, with mock session data (no Rust/Tauri build needed) — fastest loop for UI work
pnpm dev

# Full app: Next.js dev server + Tauri window with the real Rust backend
pnpm tauri dev

# Type-check
pnpm exec tsc --noEmit

# Lint
pnpm lint

# Static export build (frontend only, outputs to out/)
pnpm build

# Full desktop build (produces platform-native installers in src-tauri/target/release/bundle/)
pnpm tauri build

# Rust-only compile check (fast, from src-tauri/)
cd src-tauri && cargo check
cd src-tauri && cargo build --release
```

There is no test suite configured in this repo (no `test` script, no Jest/Vitest config).

`pnpm tauri build` produces installers only for the OS you build on (`.deb`/`.AppImage`/`.rpm` on Linux, `.dmg`/`.app` on macOS, `.msi`/`.exe` on Windows) — cross-platform installers require building on each target OS or via CI (e.g. `tauri-action`).

## Architecture

### Split: static frontend + native backend

The frontend is a Next.js App Router project built with `output: "export"` (see `next.config.ts`) — it compiles to static HTML/JS in `out/`, which Tauri embeds and serves in its native webview (see `frontendDist` in `src-tauri/tauri.conf.json`). This means **no server runtime, no API routes, no SSR, no dynamic route params** — everything is a client component (`"use client"`) that talks to Rust exclusively through Tauri's `invoke()` IPC.

`src/lib/tauri.ts` is the single boundary between frontend and backend. Every exported function (`listSessions`, `createSession`, `editSession`, `deleteSession`, `generateSshKey`, `listExistingKeys`, `copyToClipboard`) checks `isTauri()` (looks for `window.__TAURI_INTERNALS__`) and falls back to an in-memory mock store (`src/lib/mock-data.ts`) when not running inside Tauri. This is what makes `pnpm dev` in a plain browser usable for UI iteration — it never touches real files. When adding a new Tauri command, add both the real `invoke()` call and a mock branch here, and register the command in `src-tauri/src/lib.rs`'s `invoke_handler!` list.

### Rust backend (`src-tauri/src/`)

- `gitconfig.rs` / `sshconfig.rs` — hand-rolled line-based parsers (no external ini/config crate) that read and surgically edit `~/.gitconfig` and `~/.ssh/config` in place, preserving all unrelated content, comments, and formatting. They work by locating line ranges for a given `[section "sub"]` or `Host` block and only rewriting those lines. Any new mutation of these files should follow the same pattern (find line range → `backup::backup_file` → rewrite only that range) rather than reserializing the whole file, or user config will lose comments/ordering.
- `session.rs` — the correlation engine. `list_sessions()` cross-references the includeIf bindings, identity files, and SSH Host blocks to build the `Session` list, assigning `health` (`ok`/`warn`/`error`) and specific `Problem` messages. This is the core domain logic; UI changes to warnings/health should originate here, not be faked in the frontend.
- `keygen.rs` — shells out to the system `ssh-keygen` binary (no crypto crate) to generate real ed25519 keypairs. Requires OpenSSH on `PATH`.
- `backup.rs` — every mutating operation calls `backup_file()` first, writing a `<file>.bak.<timestamp>` sibling before any write.
- `commands.rs` — the `#[tauri::command]` functions exposed to the frontend; thin wrappers that call into the modules above and shape `Result<T, String>` responses. All mutating commands take a `dry_run: bool` and skip the actual filesystem write when true, still returning what *would* change (`changed_files`).
- `paths.rs` — home-dir resolution and `~`-path expand/collapse helpers used everywhere file paths cross the Rust/TS boundary (paths are always stored/returned in `~`-collapsed form).

The `Session`/`Problem` structs in `session.rs` (serde `rename_all = "camelCase"`) and the TypeScript types in `src/lib/types.ts` are two independent hand-written definitions with **no shared codegen** — if you change one, update the other.

### Frontend component organization

- `src/components/ui/` — generic, product-agnostic primitives (Button, Dialog, AlertDialog, Select, Switch, Card, Toast, etc.)
- `src/components/session/` — product-specific primitives (ProviderIcon, SessionListItem, WarningItem, Stepper)
- `src/components/layout/` — the three-pane app chrome (TitleBar, Sidebar, DetailPane)
- `src/components/modals/` — the three mutation flows (CreateWizard, EditDialog, DeleteDialog)
- `src/app/page.tsx` — top-level orchestrator: owns session/modal/toast/dry-run state and wires everything together (mirrors the original design system's `App.jsx`)

### Styling: CSS custom properties, not Tailwind utility classes

Design tokens (colors, spacing, radii, typography, shadows) live as CSS custom properties in `:root` in `src/app/globals.css`, ported directly from the Claude Design system's `tokens/*.css`. Components consume them via **inline `style` objects referencing `var(--token)`** (e.g. `style={{ background: "var(--surface)", borderRadius: "var(--radius-md)" }}`), not Tailwind utility classes — this matches how the source design system itself is authored and is what keeps the port pixel-faithful. Tailwind is installed and configured (v4, CSS-based via `@theme` in `globals.css`) but is intentionally used sparingly. When adding new UI, follow the existing inline-style-with-CSS-vars pattern rather than converting to Tailwind classes.

### Keyboard-first design

The whole app is operable without a mouse, emulating a TUI. Global shortcuts (`n` new, `r` reload, `q` quit, `j`/`k`/arrows navigate, `Enter`/`l` focus detail, `e` edit, `d` delete) are handled by `src/hooks/use-keyboard-shortcuts.ts` and are suppressed while any modal is open or an `<input>`/`<textarea>` has focus. Each modal owns its own keys instead: `Dialog` handles `Esc`, `AlertDialog` handles `y`/`n`/`Esc`, `DeleteDialog` additionally handles `t` to toggle "delete SSH key from disk".

### Provider branding

`src/components/session/provider-icon.tsx` renders GitHub/GitLab/Bitbucket marks from the `simple-icons` npm package (SVG path data bundled at build time) rather than fetching from a CDN, since the app must work fully offline as a desktop app.

## Specialized agents

Project-level subagents live in `.claude/agents/`, scoped to this repo's work domains:

**Writers (make changes):**
- **`rust-backend`** — `src-tauri/` changes: Tauri commands, config parsers, session correlation, key generation, backups
- **`ui-designer`** — `src/components/`, `src/app/globals.css`, layout/visual/keyboard-interaction work

**Orientation (read-only search):**
- **`git-sessions-explorer`** — read-only codebase search/orientation (runs on haiku for speed); use before a change to find the right files without burning context re-deriving the architecture

**Reviewers (guard invariants after a change):**
- **`ipc-contract-guardian`** — after a command or shared-shape change, keeps the four-sided IPC contract in lockstep (Rust struct+serde ⇄ `invoke_handler!` ⇄ `src/lib/types.ts` ⇄ `src/lib/tauri.ts` real+mock). Since there's no codegen, this drift fails silently at runtime; run it before shipping IPC changes.
- **`config-parser-reviewer`** — read-only auditor for changes to `gitconfig.rs`/`sshconfig.rs`/`backup.rs`/config mutations; verifies surgical line-range edits (never whole-file reserialization), backup-before-write, and honest `dry_run`, to protect the user's real config files.

Prefer delegating to the matching agent when a task falls squarely in one of these domains, since each has the relevant conventions preloaded instead of needing to be re-derived from this file. A typical flow: `git-sessions-explorer` to scope → `rust-backend`/`ui-designer` to implement → `ipc-contract-guardian`/`config-parser-reviewer` to verify.

## Keeping this file current

This file drifts as the codebase grows — treat it as documentation that needs updating, not a one-time snapshot. When a change alters something described above (a module's responsibility, the IPC contract, the styling convention, a build command), update the relevant section in the same change rather than leaving it stale for the next session to discover the hard way.

## Git sanitize

- Do not mention any AI agents when making commits or PRs.

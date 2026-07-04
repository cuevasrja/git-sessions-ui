<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GitSessionManager — agent guide

This file is the cross-tool entry point (Codex, Cursor, and other AGENTS.md-aware
agents). The authoritative, in-depth architecture doc is `CLAUDE.md` at the repo
root — read it before non-trivial work. This file is the short version plus the
roster of specialized subagents.

## What this is

A Tauri v2 desktop app (Rust backend + Next.js 16 / TypeScript frontend) that
manages multiple Git identities / SSH sessions. It keeps three easily-desynced
sources of truth in lockstep — `~/.gitconfig.<name>`, `[includeIf]` bindings in
`~/.gitconfig`, and `Host` blocks in `~/.ssh/config` — and surfaces correlation
problems between them as health/warnings in the UI.

## Search here first (token-saving index)

`.claude/project-graph.json` is a graph index of the whole repo — every source
file mapped to its role, symbols, relationships, the cross-cutting flows (IPC
contract, mutation flows), and an IPC `commands` lookup. **Read it before Grep/Glob
to locate code; it answers "where is X" in one cheap read.** After adding/moving/
removing a file, update it and run `.claude/skills/project-map/scripts/scan.sh
snapshot`. The `/project-map` skill (Claude Code) automates query/update.

## Non-negotiable invariants

- **Static frontend, native backend.** The frontend is `output: "export"` static
  HTML/JS in Tauri's webview: no SSR, no API routes, no server runtime. Every
  component is `"use client"` and talks to Rust only through `invoke()`.
- **`src/lib/tauri.ts` is the single IPC boundary.** Every command has a real
  `invoke()` branch and an `isTauri()`-guarded mock branch (`src/lib/mock-data.ts`)
  so `pnpm dev` works in a plain browser. New commands need both, plus a
  `src-tauri/src/lib.rs` `invoke_handler!` registration.
- **No shared codegen.** The Rust `Session`/`Problem`/input structs (serde
  `rename_all = "camelCase"`) and `src/lib/types.ts` are hand-synced. Change one,
  change the other. Nothing enforces this at build time.
- **Config files are edited surgically.** `gitconfig.rs`/`sshconfig.rs` locate a
  line range and rewrite only it — never reserialize the whole file, or user
  comments/ordering are lost. Every mutating write calls `backup::backup_file`
  first. Every mutating command honors `dry_run` (no writes, but returns
  `changed_files`).
- **Styling is CSS custom properties, not Tailwind utilities.** Consume design
  tokens via inline `style={{ … "var(--token)" }}` objects. Dark-mode only.
- **Keyboard-first.** Every interactive element needs a keyboard path; global
  shortcuts live in `src/hooks/use-keyboard-shortcuts.ts`.

## Node version

`.nvmrc` pins the Node version (currently 24, matching the LTS used in the
release workflow). Run `nvm use` before any `pnpm`/`node` command so local
runs match CI — don't rely on whatever Node happens to be active in the shell.

## Common commands

```bash
nvm use                      # switch to the Node version pinned in .nvmrc
pnpm dev                     # frontend + mock data, browser (fast UI loop)
pnpm tauri dev               # full app with real Rust backend
pnpm exec tsc --noEmit       # type-check
pnpm lint                    # lint
cd src-tauri && cargo check  # fast Rust compile check
```

There is no test suite in this repo.

## Git hygiene

Do not mention AI agents/assistants in commit messages or PRs.

## Specialized subagents (`.claude/agents/`)

Claude Code loads these automatically; other tools can read them as role prompts.
Prefer the matching agent — each has the relevant conventions preloaded.

| Agent | Scope | Mode |
|-------|-------|------|
| `rust-backend` | `src-tauri/` — Tauri commands, config parsers, session correlation, keygen, backups | writes code |
| `ui-designer` | `src/components/`, `globals.css`, layout/visual/keyboard work | writes code |
| `git-sessions-explorer` | read-only orientation: "where is X" / scope a change before editing | read-only (haiku) |
| `ipc-contract-guardian` | keeps the four-sided Rust↔TS IPC contract in lockstep after command/shape changes | reviews + fixes drift |
| `config-parser-reviewer` | audits config-mutation safety (surgical edits, backups, `dry_run`) before shipping | read-only audit |

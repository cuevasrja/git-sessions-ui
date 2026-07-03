---
name: rust-backend
description: Use this agent for any work inside `src-tauri/` — adding or changing Tauri commands, editing the `~/.gitconfig`/`~/.ssh/config` parsers, session correlation/health logic, ed25519 key generation, or backup behavior. Proactively use it when a task touches Rust source files or the Tauri command surface, even if the request originates from a frontend feature (e.g. "add a field to the edit form" usually needs a matching `commands.rs` + `session.rs` change).
tools: Read, Edit, Write, Bash, Grep, Glob
---

You work on the Rust backend of GitSessionManager, a Tauri v2 desktop app, in `src-tauri/src/`. Read `CLAUDE.md` at the repo root first — it documents the split between the static Next.js frontend and this backend, and the IPC boundary (`src/lib/tauri.ts` on the TS side).

## Module map

- `paths.rs` — home-dir resolution, `~`-path expand/collapse. Every path that crosses the Rust/TS boundary is stored and returned in `~`-collapsed form (`paths::collapse_home`). Use this consistently — don't leak absolute paths to the frontend.
- `gitconfig.rs` / `sshconfig.rs` — hand-rolled line-based parsers, **not** a generic ini/config crate. They locate the line range of a `[section "sub"]` header or `Host` block and only rewrite those lines, so user comments/ordering/unrelated sections survive edits untouched. Any new mutation must follow the same pattern: locate the exact line range → `backup::backup_file(&path)` → rewrite only that range → write. Never reserialize the whole file from a parsed structure — that's how user data gets silently reformatted or lost.
- `session.rs` — the correlation engine (`list_sessions`). Cross-references `includeIf` bindings, identity files, and SSH `Host` blocks into `Session`s with a `health` (`ok`/`warn`/`error`) and a `Vec<Problem>`. This is where new warning types belong — don't fake correlation logic in the frontend.
- `keygen.rs` — shells out to the system `ssh-keygen` binary (no crypto crate dependency). Assumes OpenSSH is on `PATH`.
- `backup.rs` — `backup_file()` writes a `<file>.bak.<timestamp>` sibling before any mutating write. Every write path in `gitconfig.rs`/`sshconfig.rs` calls this first.
- `commands.rs` — the `#[tauri::command]` functions exposed to the frontend. Thin wrappers returning `Result<T, String>`. Every mutating command takes `dry_run: bool` and must skip the actual filesystem write when true while still returning what *would* change (see `MutationResult.changed_files`) — preserve this contract for new commands.
- `lib.rs` — plugin registration and the `invoke_handler!` command list. New commands must be added here or the frontend's `invoke()` call will fail silently at runtime with no compile-time error.

## Conventions

- Serde structs shared with TypeScript use `#[serde(rename_all = "camelCase")]`. The `Session`/`Problem` types here and `src/lib/types.ts` are two independent hand-written definitions with no codegen — when you change one, update the other and say so explicitly.
- Prefer `Result<T, String>` with `.map_err(|e| e.to_string())` over introducing new error-handling crates (no `anyhow`/`thiserror` in this codebase currently).
- After any change, run `cargo check` (fast) from `src-tauri/`, and `cargo build --release` before considering backend work done if the change is non-trivial.
- If you change what a module is responsible for (not just its internals), update the corresponding paragraph in the root `CLAUDE.md`'s Architecture section — that file is the map future sessions rely on.

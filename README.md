# GitSessionManager

A desktop app for managing multiple Git identities and SSH sessions — a GUI replacement for a `~/.gitconfig` / `~/.ssh/config` juggling workflow. Built with [Tauri](https://tauri.app) (Rust backend) and [Next.js](https://nextjs.org) (React/TypeScript frontend), statically exported into the webview.

It keeps three easily-desynced sources of truth in lockstep:

1. `~/.gitconfig.<name>` — the per-identity Git config
2. `[includeIf]` folder bindings in `~/.gitconfig`
3. `Host` blocks and keys in `~/.ssh/config`

and surfaces correlation problems between them (orphaned `includeIf`, uncorrelated `Host`, missing `IdentityFile`).

## Development

```bash
pnpm install
pnpm tauri dev
```

`pnpm dev` alone runs just the Next.js frontend in a browser with mock data — useful for fast UI iteration without rebuilding the Rust backend.

## Building

```bash
pnpm tauri build
```

Produces platform-native installers (`.dmg`/`.app` on macOS, `.msi`/`.exe` on Windows, `.deb`/`.AppImage`/`.rpm` on Linux) in `src-tauri/target/release/bundle/`.

## Releasing

Pushing a `vX.Y.Z` tag triggers `.github/workflows/release.yml`, which builds installers for Linux, Windows, and macOS in parallel and attaches them to a draft GitHub Release.

To cut a release:

1. **Bump the version in both files** — they must match exactly, or the workflow fails before building anything:
   - `version` in `package.json`
   - `version` in `src-tauri/tauri.conf.json`

2. **Commit the version bump:**
   ```bash
   git add package.json src-tauri/tauri.conf.json
   git commit -m "chore: bump version to X.Y.Z"
   ```

3. **Tag and push:**
   ```bash
   git tag vX.Y.Z
   git push origin main --tags
   ```

4. **Watch the workflow** in the repo's Actions tab. It runs three stages:
   - `check-version` — fails fast if the tag doesn't match `package.json`/`tauri.conf.json`
   - `quality` — `pnpm lint`, `pnpm exec tsc --noEmit`, `cargo check`
   - `build` — matrix build across `ubuntu-latest` / `windows-latest` / `macos-latest` using [`tauri-action`](https://github.com/tauri-apps/tauri-action)

5. **Review and publish the draft Release** on GitHub once all three platform builds finish — it's created as a draft so you can check the attached artifacts before making it public.

Builds are unsigned — installing on macOS and Windows will show an "unidentified developer" / SmartScreen warning until code signing and notarization are set up (not yet configured; requires an Apple Developer ID and a Windows code-signing certificate).

## Project layout

- `src/` — Next.js frontend (App Router, TypeScript). `src/components/ui` are shared primitives, `src/components/session` and `src/components/layout` are product-specific, `src/components/modals` holds the create/edit/delete flows.
- `src-tauri/` — Rust backend. `gitconfig.rs` and `sshconfig.rs` parse and edit the config files in place (preserving unrelated content); `session.rs` correlates them into the session list; `keygen.rs` shells out to `ssh-keygen`; `backup.rs` writes timestamped `.bak.<timestamp>` backups before every write.

## Keyboard shortcuts

`n` new session · `r` reload from disk · `q` quit · `j`/`k` or arrows navigate the list · `Enter`/`l` focus the detail pane · `e` edit · `d` delete · `Esc` close a dialog · `y`/`n` confirm/cancel a delete · `t` toggle "delete SSH key" in the delete dialog.

import type { CreateSessionInput, EditSessionInput, GeneratedKey, MutationResult, Session } from "./types";
import { MOCK_EXISTING_KEYS, MOCK_SESSIONS } from "./mock-data";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function closeWindow(): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().close();
}

// In-browser fallback store so `pnpm dev` outside the Tauri shell still
// behaves coherently (no real files are touched).
let mockSessions: Session[] = MOCK_SESSIONS.map((s) => ({ ...s, problems: [...s.problems] }));
let mockKeys: string[] = [...MOCK_EXISTING_KEYS];

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
}

export async function listSessions(): Promise<Session[]> {
  if (!isTauri()) return Promise.resolve(mockSessions);
  return invoke<Session[]>("list_sessions_cmd");
}

export async function createSession(input: CreateSessionInput, dryRun: boolean): Promise<MutationResult> {
  if (!isTauri()) {
    const host = { github: "github.com", gitlab: "gitlab.com", bitbucket: "bitbucket.org", custom: input.host || "host" }[input.provider];
    // Matches the git-session-tui convention: `<name>.<host>`.
    const alias = `${input.name}.${host}`;
    const session: Session = {
      id: input.name,
      name: input.name,
      provider: input.provider,
      readOnly: false,
      health: "ok",
      email: input.email,
      signingKey: input.signingKey,
      gitdir: input.gitdir || `~/${input.name}/`,
      host,
      alias,
      sshUser: input.sshUser,
      keyPath: input.keyPath,
      problems: [],
    };
    if (!dryRun) mockSessions = [...mockSessions, session];
    return { session, changedFiles: ["~/.gitconfig", `~/.gitconfig.${input.name}`, "~/.ssh/config"] };
  }
  return invoke<MutationResult>("create_session", { input, dryRun });
}

export async function editSession(input: EditSessionInput, dryRun: boolean): Promise<MutationResult> {
  if (!isTauri()) {
    const session: Session = { ...input, id: input.name, readOnly: false, health: "ok", problems: [] };
    if (!dryRun) mockSessions = mockSessions.map((s) => (s.id === input.name ? session : s));
    return { session, changedFiles: ["~/.gitconfig", `~/.gitconfig.${input.name}`, "~/.ssh/config"] };
  }
  return invoke<MutationResult>("edit_session", { input, dryRun });
}

export async function deleteSession(name: string, alias: string, keyPath: string, deleteKey: boolean, dryRun: boolean): Promise<string[]> {
  if (!isTauri()) {
    if (!dryRun) mockSessions = mockSessions.filter((s) => s.name !== name);
    const changed = ["~/.gitconfig", `~/.gitconfig.${name}`, "~/.ssh/config"];
    if (deleteKey) changed.push(keyPath, `${keyPath}.pub`);
    return changed;
  }
  return invoke<string[]>("delete_session", { name, alias, keyPath, deleteKey, dryRun });
}

export async function generateSshKey(name: string, passphrase: string, comment: string): Promise<GeneratedKey> {
  if (!isTauri()) {
    await new Promise((r) => setTimeout(r, 900));
    const privatePath = `~/.ssh/id_${name}`;
    mockKeys = [...mockKeys, privatePath];
    return {
      privatePath,
      publicPath: `${privatePath}.pub`,
      publicKey: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL9m2Kd0pQ8rT3vXnB7uYw1eZ4hJ2sF6cN0aQ9bR5oP ${comment}`,
    };
  }
  return invoke<GeneratedKey>("generate_ssh_key", { name, passphrase, comment });
}

export async function listExistingKeys(): Promise<string[]> {
  if (!isTauri()) return Promise.resolve(mockKeys);
  return invoke<string[]>("list_existing_keys");
}

export async function copyToClipboard(text: string): Promise<void> {
  if (!isTauri()) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
  await writeText(text);
}

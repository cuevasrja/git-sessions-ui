export type Provider = "github" | "gitlab" | "bitbucket" | "custom";
export type Health = "ok" | "warn" | "error";
export type Tone = "warn" | "error";

export interface Problem {
  tone: Tone;
  title: string;
  detail: string;
  suggestion: string;
}

export interface Session {
  id: string;
  name: string;
  provider: Provider;
  readOnly: boolean;
  health: Health;
  email: string;
  signingKey: string;
  gitdir: string;
  host: string;
  alias: string;
  sshUser: string;
  keyPath: string;
  problems: Problem[];
}

export interface CreateSessionInput {
  name: string;
  provider: Provider;
  host: string;
  email: string;
  gitdir: string;
  signingKey: string;
  sshUser: string;
  keyPath: string;
}

export interface EditSessionInput {
  name: string;
  provider: Provider;
  email: string;
  gitdir: string;
  signingKey: string;
  sshUser: string;
  keyPath: string;
  host: string;
  alias: string;
}

export interface MutationResult {
  session: Session;
  changedFiles: string[];
}

export interface GeneratedKey {
  privatePath: string;
  publicPath: string;
  publicKey: string;
}

export type ToastTone = "green" | "amber" | "red" | "blue";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  mono?: boolean;
}

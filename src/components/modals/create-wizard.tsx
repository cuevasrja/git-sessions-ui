"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Folder, GitBranch, KeyRound, Server, Shield, Sparkles, Wand2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Stepper } from "@/components/session/stepper";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RadioGroup } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { CodeWell } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProviderIcon } from "@/components/session/provider-icon";
import { copyToClipboard, generateSshKey, listExistingKeys } from "@/lib/tauri";
import type { CreateSessionInput, GeneratedKey, Provider } from "@/lib/types";

interface CreateWizardProps {
  open: boolean;
  dryRun: boolean;
  onClose: () => void;
  onCreate: (input: CreateSessionInput) => void;
  onCopyPublicKey: () => void;
}

interface FormState {
  name: string;
  provider: Provider;
  host: string;
  email: string;
  gitdir: string;
  signingKey: string;
  sshUser: string;
  keyMode: "existing" | "generate";
  existingKey: string;
  passphrase: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  provider: "github",
  host: "",
  email: "",
  gitdir: "",
  signingKey: "",
  sshUser: "git",
  keyMode: "generate",
  existingKey: "",
  passphrase: "",
};

const HOST_FOR_PROVIDER: Record<Provider, string> = { github: "github.com", gitlab: "gitlab.com", bitbucket: "bitbucket.org", custom: "" };

export function CreateWizard({ open, dryRun, onClose, onCreate, onCopyPublicKey }: CreateWizardProps) {
  const [step, setStep] = React.useState(0);
  const [f, setF] = React.useState<FormState>(INITIAL_FORM);
  const [existingKeys, setExistingKeys] = React.useState<string[]>([]);
  const [genStatus, setGenStatus] = React.useState<"idle" | "running" | "done">("idle");
  const [genPct, setGenPct] = React.useState(0);
  const [generatedKey, setGeneratedKey] = React.useState<GeneratedKey | null>(null);
  const [genError, setGenError] = React.useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  React.useEffect(() => {
    if (open) {
      setStep(0);
      setF(INITIAL_FORM);
      setGenStatus("idle");
      setGenPct(0);
      setGeneratedKey(null);
      setGenError(null);
      listExistingKeys().then((keys) => {
        setExistingKeys(keys);
        setF((s) => ({ ...s, existingKey: keys[0] ?? "" }));
      });
    }
  }, [open]);

  const host = f.provider === "custom" ? f.host : HOST_FOR_PROVIDER[f.provider];
  const alias = f.name ? `${host || "host"}-${f.name}` : "";

  const runGen = async () => {
    setGenStatus("running");
    setGenPct(0);
    setGenError(null);
    const ticker = setInterval(() => setGenPct((p) => Math.min(p + 8, 92)), 90);
    try {
      const key = await generateSshKey(f.name || "new", f.passphrase, f.email || "you@host");
      clearInterval(ticker);
      setGenPct(100);
      setGeneratedKey(key);
      setGenStatus("done");
    } catch (err) {
      clearInterval(ticker);
      setGenStatus("idle");
      setGenPct(0);
      setGenError(err instanceof Error ? err.message : String(err));
    }
  };

  const canNextStep0 = f.name.trim() && f.email.trim() && (f.provider !== "custom" || f.host.trim());
  const canNextStep2 = f.keyMode === "existing" ? !!f.existingKey : !!generatedKey;
  const canNext = step === 0 ? canNextStep0 : step === 1 ? true : canNextStep2;

  const submit = () => {
    const keyPath = f.keyMode === "generate" ? generatedKey?.privatePath ?? "" : f.existingKey;
    onCreate({
      name: f.name,
      provider: f.provider,
      host: f.provider === "custom" ? f.host : "",
      email: f.email,
      gitdir: f.gitdir,
      signingKey: f.signingKey,
      sshUser: f.sshUser,
      keyPath,
    });
  };

  const next = () => {
    if (!canNext) return;
    if (step < 2) setStep(step + 1);
    else submit();
  };
  const back = () => setStep(step - 1);

  const footer = (
    <>
      {step > 0 && (
        <Button variant="ghost" onClick={back} icon={<ArrowLeft style={{ width: "100%", height: "100%" }} />}>
          Back
        </Button>
      )}
      <div style={{ flex: 1 }} />
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        kbd="Enter"
        disabled={!canNext}
        onClick={next}
        iconRight={step < 2 ? <ArrowRight style={{ width: "100%", height: "100%" }} /> : null}
      >
        {step < 2 ? "Next" : dryRun ? "Preview changes" : "Create session"}
      </Button>
    </>
  );

  const providerOpts = [
    { value: "github", label: "GitHub", icon: <ProviderIcon provider="github" /> },
    { value: "gitlab", label: "GitLab", icon: <ProviderIcon provider="gitlab" /> },
    { value: "bitbucket", label: "Bitbucket", icon: <ProviderIcon provider="bitbucket" /> },
    { value: "custom", label: "Custom host", icon: <ProviderIcon provider="custom" /> },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width={560}
      title="New session"
      icon={<GitBranch style={{ width: "100%", height: "100%" }} />}
      subtitle={dryRun ? "Dry-run — changes are previewed, not written" : "Wire up ~/.gitconfig, includeIf and ~/.ssh/config together"}
      footer={footer}
    >
      <div style={{ marginBottom: 20 }}>
        <Stepper steps={["Identity", "Paths", "SSH key"]} current={step} />
      </div>

      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Name" required hint="Config suffix + host alias">
              <Input placeholder="work" value={f.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </Field>
            <Field label="Provider" required>
              <Select value={f.provider} onChange={(v) => set("provider", v as Provider)} options={providerOpts} />
            </Field>
          </div>
          {f.provider === "custom" && (
            <Field label="Host" required hint="The Git host domain — becomes the SSH HostName and insteadOf target">
              <Input mono placeholder="git.company.com" value={f.host} onChange={(e) => set("host", e.target.value)} prefix={<Server style={{ width: 15, height: 15 }} />} autoFocus />
            </Field>
          )}
          <Field label="Email" required hint="Sets user.email in the derived config">
            <Input placeholder="you@work.com" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          {f.name && (
            <div style={{ padding: "10px 12px", background: "var(--blue-subtle)", border: "1px solid var(--blue-border)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--blue-fg)", marginBottom: 6 }}>
                <Wand2 style={{ width: 13, height: 13 }} />
                Multi-account pattern applied
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text)", wordBreak: "break-all" }}>
                {`[url "git@${alias}:"] insteadOf = git@${host || "host"}:`}
              </code>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="gitdir" required hint="Repos under this path use this identity (includeIf)">
            <Input mono placeholder="~/work/" value={f.gitdir} onChange={(e) => set("gitdir", e.target.value)} prefix={<Folder style={{ width: 15, height: 15 }} />} autoFocus />
          </Field>
          <Field label="Signing key" hint="Optional — GPG/SSH key id for commit signing">
            <Input mono placeholder="(none)" value={f.signingKey} onChange={(e) => set("signingKey", e.target.value)} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="SSH user" hint="Almost always “git”">
            <Input mono value={f.sshUser} onChange={(e) => set("sshUser", e.target.value)} wrapStyle={{ maxWidth: 160 }} />
          </Field>
          <Field label="SSH key">
            <RadioGroup
              layout="cards"
              value={f.keyMode}
              onChange={(v) => {
                set("keyMode", v as "existing" | "generate");
                setGenStatus("idle");
                setGenPct(0);
              }}
              options={[
                { value: "existing", label: "Use an existing key", description: "Pick an id_* already in ~/.ssh", icon: <KeyRound style={{ width: "100%", height: "100%", color: "var(--text-muted)" }} /> },
                { value: "generate", label: "Generate new ed25519", description: "Create and register a fresh key", icon: <Sparkles style={{ width: "100%", height: "100%", color: "var(--green-fg)" }} /> },
              ]}
            />
          </Field>

          {f.keyMode === "existing" && (
            <Field label="Key file">
              <Select
                value={f.existingKey}
                onChange={(v) => set("existingKey", v)}
                options={existingKeys.map((k) => ({ value: k, label: k, icon: <KeyRound style={{ width: "100%", height: "100%", color: "var(--text-muted)" }} /> }))}
              />
            </Field>
          )}

          {f.keyMode === "generate" && (
            <div style={{ padding: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
              {genStatus === "idle" && (
                <>
                  <Field label="Passphrase" hint="Optional — encrypts the private key at rest">
                    <Input type="password" placeholder="(none)" value={f.passphrase} onChange={(e) => set("passphrase", e.target.value)} suffix={<Shield style={{ width: 15, height: 15 }} />} />
                  </Field>
                  {genError && <div style={{ marginTop: 10, fontSize: "var(--text-xs)", color: "var(--red-fg)" }}>{genError}</div>}
                  <div style={{ marginTop: 12 }}>
                    <Button variant="primary" icon={<Sparkles style={{ width: "100%", height: "100%" }} />} onClick={runGen} disabled={!f.name.trim()}>
                      Generate ed25519 key
                    </Button>
                  </div>
                </>
              )}
              {genStatus === "running" && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
                  <CircularProgress value={genPct} />
                  <div>
                    <div style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-medium)" }}>Generating key…</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>ssh-keygen -t ed25519</div>
                  </div>
                </div>
              )}
              {genStatus === "done" && generatedKey && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Badge tone="green" dot>
                      Key generated
                    </Badge>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{generatedKey.privatePath}</span>
                  </div>
                  <CodeWell
                    label="Public key — add this to your provider"
                    onCopy={() => {
                      copyToClipboard(generatedKey.publicKey);
                      onCopyPublicKey();
                    }}
                  >
                    {generatedKey.publicKey}
                  </CodeWell>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

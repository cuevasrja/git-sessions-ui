"use client";

import * as React from "react";
import { Folder, GitBranch, KeyRound, Lock, Pencil } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ProviderIcon } from "@/components/session/provider-icon";
import { listExistingKeys } from "@/lib/tauri";
import type { EditSessionInput, Session } from "@/lib/types";

const PROVIDER_NAMES: Record<string, string> = { github: "GitHub", gitlab: "GitLab", bitbucket: "Bitbucket", custom: "Custom host" };

interface EditDialogProps {
  open: boolean;
  dryRun: boolean;
  session: Session | undefined;
  onClose: () => void;
  onSave: (input: EditSessionInput) => void;
}

function LockedField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Field label={label}>
      <Tooltip content="To change the name or provider, delete and recreate the session." side="top">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 34,
            padding: "0 10px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-muted)",
            cursor: "not-allowed",
            width: "100%",
          }}
        >
          {icon}
          <span style={{ flex: 1, fontSize: "var(--text-md)", fontFamily: "var(--font-sans)" }}>{value}</span>
          <Lock style={{ width: 14, height: 14, color: "var(--text-subtle)" }} />
        </div>
      </Tooltip>
    </Field>
  );
}

export function EditDialog({ open, dryRun, session, onClose, onSave }: EditDialogProps) {
  const [f, setF] = React.useState<Session | undefined>(session);
  const [existingKeys, setExistingKeys] = React.useState<string[]>([]);

  // Sync local form state from the `session` prop whenever the dialog opens
  // (or the underlying session changes while open). Computed synchronously
  // during render (instead of in an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [prev, setPrev] = React.useState({ open, session });
  if (open !== prev.open || session !== prev.session) {
    setPrev({ open, session });
    if (open && session) setF(session);
  }

  React.useEffect(() => {
    if (open) listExistingKeys().then(setExistingKeys);
  }, [open]);

  if (!session || !f) return null;
  const set = <K extends keyof Session>(k: K, v: Session[K]) => setF((s) => (s ? { ...s, [k]: v } : s));

  const save = () => {
    onSave({
      name: f.name,
      provider: f.provider,
      email: f.email,
      gitdir: f.gitdir,
      signingKey: f.signingKey,
      sshUser: f.sshUser,
      keyPath: f.keyPath,
      host: f.host,
      alias: f.alias,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width={560}
      title={
        <>
          Edit <span style={{ fontFamily: "var(--font-mono)" }}>{session.name}</span>
        </>
      }
      icon={<Pencil style={{ width: "100%", height: "100%" }} />}
      subtitle={dryRun ? "Dry-run — changes are previewed, not written" : "Preserves the derived insteadOf and the rest of the Host block"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" kbd="Enter" onClick={save}>
            {dryRun ? "Preview changes" : "Save changes"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <LockedField label="Name" value={session.name} icon={<GitBranch style={{ width: 15, height: 15 }} />} />
          <LockedField label="Provider" value={PROVIDER_NAMES[session.provider] ?? "Custom host"} icon={<ProviderIcon provider={session.provider} size={15} />} />
        </div>

        <Field label="Email" required>
          <Input value={f.email} onChange={(e) => set("email", e.target.value)} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="gitdir" required>
            <Input mono value={f.gitdir} onChange={(e) => set("gitdir", e.target.value)} prefix={<Folder style={{ width: 15, height: 15 }} />} />
          </Field>
          <Field label="Signing key" hint="Optional">
            <Input mono placeholder="(none)" value={f.signingKey} onChange={(e) => set("signingKey", e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16 }}>
          <Field label="SSH user">
            <Input mono value={f.sshUser} onChange={(e) => set("sshUser", e.target.value)} />
          </Field>
          <Field label="SSH key">
            <Select
              value={f.keyPath}
              onChange={(v) => set("keyPath", v)}
              options={existingKeys.map((k) => ({ value: k, label: k, icon: <KeyRound style={{ width: "100%", height: "100%", color: "var(--text-muted)" }} /> }))}
            />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

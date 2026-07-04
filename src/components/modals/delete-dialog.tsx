"use client";

import * as React from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Kbd } from "@/components/ui/kbd";
import type { Session } from "@/lib/types";

interface DeleteDialogProps {
  open: boolean;
  dryRun: boolean;
  session: Session | undefined;
  onCancel: () => void;
  onConfirm: (deleteKey: boolean) => void;
}

function F({ children }: { children: React.ReactNode }) {
  return <code style={{ fontFamily: "var(--font-mono)", color: "var(--text)", fontSize: "var(--text-xs)" }}>{children}</code>;
}

export function DeleteDialog({ open, dryRun, session, onCancel, onConfirm }: DeleteDialogProps) {
  const [delKey, setDelKey] = React.useState(false);

  // Reset "delete key" toggle whenever the dialog transitions from closed to
  // open. Computed synchronously during render (instead of in an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDelKey(false);
  }

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "t") setDelKey((v) => !v);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!session) return null;

  return (
    <AlertDialog
      open={open}
      title={
        <>
          Delete session <span style={{ fontFamily: "var(--font-mono)" }}>{session.name}</span>?
        </>
      }
      confirmLabel={dryRun ? "Preview" : "Delete"}
      onCancel={onCancel}
      onConfirm={() => onConfirm(delKey)}
      footerExtra={
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            cursor: "pointer",
            background: delKey ? "var(--red-subtle)" : "var(--surface)",
            border: "1px solid " + (delKey ? "var(--red-border)" : "var(--border)"),
            borderRadius: "var(--radius-md)",
          }}
        >
          <Switch checked={delKey} onChange={setDelKey} tone="blue" />
          <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--text)" }}>
            Also delete the SSH key from disk
            <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{session.keyPath}</span>
          </span>
          <Kbd size="sm">t</Kbd>
        </label>
      }
    >
      <div style={{ marginBottom: 10 }}>
        The following will be modified (a backup <F>.bak.&lt;timestamp&gt;</F> is written first):
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
        <li>
          Remove the <F>[includeIf]</F> block from <F>~/.gitconfig</F>
        </li>
        <li>
          Delete <F>~/.gitconfig.{session.name}</F>
        </li>
        <li>
          Remove <F>Host {session.alias}</F> from <F>~/.ssh/config</F>
        </li>
        {delKey && (
          <li style={{ color: "var(--red-fg)" }}>
            Delete key files <F>{session.keyPath}</F> and <F>{session.keyPath}.pub</F>
          </li>
        )}
      </ul>
    </AlertDialog>
  );
}

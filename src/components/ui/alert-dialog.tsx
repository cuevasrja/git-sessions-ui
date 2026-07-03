"use client";

import * as React from "react";
import { AlertOctagon, AlertTriangle } from "lucide-react";

interface AlertDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  tone?: "red" | "amber";
  confirmLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
  footerExtra?: React.ReactNode;
}

export function AlertDialog({ open, onCancel, onConfirm, title, tone = "red", confirmLabel = "Delete", cancelLabel = "Cancel", children, footerExtra = null }: AlertDialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement).tagName?.toLowerCase();
      if (t === "input" || t === "textarea") return;
      if (e.key === "Escape" || e.key === "n") onCancel();
      else if (e.key === "y") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;
  const color = tone === "red" ? "var(--red-fg)" : "var(--amber-fg)";
  const Icon = tone === "red" ? AlertOctagon : AlertTriangle;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(1,4,9,0.6)", backdropFilter: "blur(2px)" }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        style={{
          width: 460,
          maxWidth: "100%",
          background: "var(--surface-overlay)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          animation: "gs-dialog-in var(--duration-base) var(--ease-out)",
        }}
      >
        <div style={{ display: "flex", gap: 13, padding: "18px 18px 14px" }}>
          <span
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: "var(--radius-md)",
              background: tone === "red" ? "var(--red-muted)" : "var(--amber-muted)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon style={{ width: 18, height: 18, color }} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: "var(--weight-semibold)", color: "var(--text)" }}>{title}</h2>
            <div style={{ marginTop: 8, fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: "var(--leading-normal)" }}>{children}</div>
          </div>
        </div>
        {footerExtra && <div style={{ padding: "0 18px 4px 65px" }}>{footerExtra}</div>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border-muted)", background: "var(--surface)" }}>
          <button type="button" onClick={onCancel} style={btnStyle("secondary")}>
            {cancelLabel} <span style={kbdStyle}>n</span>
          </button>
          <button type="button" onClick={onConfirm} style={btnStyle(tone === "red" ? "danger" : "primary")}>
            {confirmLabel} <span style={kbdStyle}>y</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-2xs)",
  fontWeight: 600,
  padding: "1px 4px",
  borderRadius: "var(--radius-sm)",
  background: "rgba(255,255,255,0.14)",
  marginLeft: 4,
};

function btnStyle(kind: "danger" | "primary" | "secondary"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    height: 32,
    padding: "0 12px",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-base)",
    fontWeight: "var(--weight-medium)",
    cursor: "pointer",
    border: "1px solid transparent",
  };
  if (kind === "danger") return { ...base, background: "var(--danger)", color: "#fff" };
  if (kind === "primary") return { ...base, background: "var(--primary)", color: "#fff" };
  return { ...base, background: "var(--surface-raised)", color: "var(--text)", border: "1px solid var(--border)" };
}

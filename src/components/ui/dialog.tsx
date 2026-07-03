"use client";

import * as React from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
  closeOnScrim?: boolean;
}

export function Dialog({ open, onClose, title, subtitle = null, icon = null, footer = null, width = 520, children, closeOnScrim = true }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (closeOnScrim && e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(1,4,9,0.6)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface-overlay)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          animation: "gs-dialog-in var(--duration-base) var(--ease-out)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 18px 14px", borderBottom: "1px solid var(--border-muted)" }}>
          {icon && <span style={{ width: 20, height: 20, color: "var(--text-muted)", flexShrink: 0, marginTop: 1, display: "inline-flex" }}>{icon}</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--text)", letterSpacing: "var(--tracking-tight)" }}>{title}</h2>
            {subtitle && <p style={{ margin: "3px 0 0", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: "var(--radius-sm)", display: "inline-flex", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X style={{ width: 17, height: 17 }} />
          </button>
        </div>

        <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>{children}</div>

        {footer && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border-muted)", background: "var(--surface)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

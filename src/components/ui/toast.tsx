import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ToastItem, ToastTone } from "@/lib/types";

interface ToastProps extends ToastItem {
  onClose?: () => void;
}

const TONES: Record<ToastTone, { icon: React.ElementType; color: string }> = {
  green: { icon: CheckCircle2, color: "var(--green-fg)" },
  amber: { icon: AlertTriangle, color: "var(--amber-fg)" },
  red: { icon: XCircle, color: "var(--red-fg)" },
  blue: { icon: Info, color: "var(--blue-fg)" },
};

export function Toast({ tone = "green", title, description, mono = false, onClose }: ToastProps) {
  const t = TONES[tone];
  const Icon = t.icon;

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        width: 340,
        padding: "12px 12px 12px 14px",
        background: "var(--surface-overlay)",
        border: "1px solid var(--border)",
        borderLeft: `2px solid ${t.color}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        animation: "gs-toast-in var(--duration-base) var(--ease-out)",
      }}
    >
      <Icon style={{ width: 18, height: 18, color: t.color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-medium)", color: "var(--text)" }}>{title}</div>
        {description && (
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-muted)",
              marginTop: 2,
              fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
              wordBreak: "break-all",
            }}
          >
            {description}
          </div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            color: "var(--text-muted)",
            display: "inline-flex",
            flexShrink: 0,
          }}
        >
          <X style={{ width: 15, height: 15 }} />
        </button>
      )}
    </div>
  );
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 2000, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

interface CardProps {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  inset?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}

export function Card({ eyebrow = null, title = null, actions = null, inset = false, children, style = {}, bodyStyle = {} }: CardProps) {
  const hasHeader = eyebrow || title || actions;
  return (
    <div style={{ background: inset ? "var(--canvas-inset)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", ...style }}>
      {hasHeader && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border-muted)" }}>
          <div style={{ minWidth: 0 }}>
            {eyebrow && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", color: "var(--text-muted)" }}>
                {eyebrow}
              </div>
            )}
            {title && <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--text)", marginTop: eyebrow ? 2 : 0 }}>{title}</div>}
          </div>
          {actions && <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: 14, ...bodyStyle }}>{children}</div>
    </div>
  );
}

interface CodeWellProps {
  label?: string | null;
  children: React.ReactNode;
  onCopy?: (() => void) | null;
  style?: React.CSSProperties;
}

export function CodeWell({ label = null, children, onCopy = null, style = {} }: CodeWellProps) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div style={{ ...style }}>
      {(label || onCopy) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          {label && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", color: "var(--text-muted)" }}>
              {label}
            </span>
          )}
          {onCopy && (
            <button
              type="button"
              onClick={copy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: copied ? "var(--green-fg)" : "var(--text-muted)",
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-sans)",
                padding: 0,
              }}
            >
              {copied ? <Check style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      )}
      <pre
        style={{
          margin: 0,
          padding: "10px 12px",
          background: "var(--canvas-inset)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-inset)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          lineHeight: "var(--leading-relaxed)",
          color: "var(--text)",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {children}
      </pre>
    </div>
  );
}

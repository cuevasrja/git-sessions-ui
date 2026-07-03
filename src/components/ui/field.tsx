import * as React from "react";

interface FieldProps {
  label?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Field({ label, required = false, hint = null, error = null, htmlFor, children, style = {} }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && (
        <label
          htmlFor={htmlFor}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text)" }}
        >
          {label}
          {required && <span style={{ color: "var(--red-fg)" }}>*</span>}
        </label>
      )}
      {children}
      {(error || hint) && (
        <span style={{ fontSize: "var(--text-xs)", lineHeight: "var(--leading-snug)", color: error ? "var(--red-fg)" : "var(--text-muted)" }}>{error || hint}</span>
      )}
    </div>
  );
}

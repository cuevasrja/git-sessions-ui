"use client";

import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  kbd?: string | null;
  loading?: boolean;
  fullWidth?: boolean;
}

const SIZES: Record<ButtonSize, { height: number; padding: string; font: string; gap: number; icon: number }> = {
  sm: { height: 26, padding: "0 8px", font: "var(--text-sm)", gap: 5, icon: 14 },
  md: { height: 32, padding: "0 12px", font: "var(--text-base)", gap: 6, icon: 16 },
  lg: { height: 38, padding: "0 16px", font: "var(--text-md)", gap: 8, icon: 18 },
};

const VARIANTS: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--primary)", color: "var(--primary-fg)", border: "1px solid transparent" },
  secondary: { background: "var(--surface-raised)", color: "var(--text)", border: "1px solid var(--border)" },
  ghost: { background: "transparent", color: "var(--text)", border: "1px solid transparent" },
  danger: { background: "var(--danger)", color: "var(--text-on-emphasis)", border: "1px solid transparent" },
  "danger-ghost": { background: "transparent", color: "var(--red-fg)", border: "1px solid var(--border)" },
};

const HOVER_BG: Record<ButtonVariant, string> = {
  primary: "var(--primary-hover)",
  secondary: "var(--surface-overlay)",
  ghost: "var(--hover-bg)",
  danger: "var(--danger-hover)",
  "danger-ghost": "var(--red-muted)",
};

const ACTIVE_BG: Record<ButtonVariant, string> = {
  primary: "var(--primary-active)",
  secondary: "var(--surface-raised)",
  ghost: "var(--active-bg)",
  danger: "var(--danger-active)",
  "danger-ghost": "var(--red-muted)",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon = null,
  iconRight = null,
  kbd = null,
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  style = {},
  ...rest
}: ButtonProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    height: s.height,
    padding: s.padding,
    width: fullWidth ? "100%" : "auto",
    fontFamily: "var(--font-sans)",
    fontSize: s.font,
    fontWeight: "var(--weight-medium)",
    lineHeight: 1,
    borderRadius: "var(--radius-md)",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    userSelect: "none",
    whiteSpace: "nowrap",
    transition: "background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
    ...v,
    ...style,
  };

  const iconSize = { width: s.icon, height: s.icon };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      style={base}
      onMouseEnter={(e) => {
        if (!disabled && !loading) e.currentTarget.style.background = HOVER_BG[variant];
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = (v.background as string) ?? "";
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) e.currentTarget.style.background = ACTIVE_BG[variant];
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) e.currentTarget.style.background = HOVER_BG[variant];
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "var(--ring)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
      {...rest}
    >
      {loading ? (
        <span
          style={{
            ...iconSize,
            borderRadius: "50%",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            display: "inline-block",
            animation: "gs-spin 0.6s linear infinite",
          }}
        />
      ) : icon ? (
        <span style={{ ...iconSize, display: "inline-flex" }}>{icon}</span>
      ) : null}
      {children != null && <span>{children}</span>}
      {iconRight && <span style={{ ...iconSize, display: "inline-flex" }}>{iconRight}</span>}
      {kbd && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-2xs)",
            fontWeight: 600,
            marginLeft: 2,
            padding: "1px 4px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(255,255,255,0.12)",
            opacity: 0.85,
          }}
        >
          {kbd}
        </span>
      )}
    </button>
  );
}

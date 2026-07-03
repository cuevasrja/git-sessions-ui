"use client";

import * as React from "react";

type IconButtonVariant = "ghost" | "secondary" | "danger";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: React.ReactNode;
  "aria-label": string;
  active?: boolean;
}

const SIZES: Record<IconButtonSize, { box: number; icon: number }> = {
  sm: { box: 24, icon: 14 },
  md: { box: 30, icon: 16 },
  lg: { box: 36, icon: 18 },
};

export function IconButton({ variant = "ghost", size = "md", icon, disabled = false, active = false, style = {}, ...rest }: IconButtonProps) {
  const s = SIZES[size];
  const variants: Record<IconButtonVariant, React.CSSProperties> = {
    ghost: { background: active ? "var(--active-bg)" : "transparent", color: "var(--text)", border: "1px solid transparent" },
    secondary: { background: "var(--surface-raised)", color: "var(--text)", border: "1px solid var(--border)" },
    danger: { background: "transparent", color: "var(--red-fg)", border: "1px solid transparent" },
  };
  const v = variants[variant];
  const hover: Record<IconButtonVariant, string> = { ghost: "var(--hover-bg)", secondary: "var(--surface-overlay)", danger: "var(--red-muted)" };

  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: s.box,
        height: s.box,
        borderRadius: "var(--radius-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background var(--duration-fast) var(--ease-standard)",
        ...v,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = hover[variant];
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = (v.background as string) ?? "";
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "var(--ring)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
      {...rest}
    >
      <span style={{ width: s.icon, height: s.icon, display: "inline-flex" }}>{icon}</span>
    </button>
  );
}

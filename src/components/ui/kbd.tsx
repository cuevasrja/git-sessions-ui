import * as React from "react";

interface KbdProps {
  children: React.ReactNode;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

export function Kbd({ children, size = "md", style = {} }: KbdProps) {
  const sizes = {
    sm: { h: 16, font: "var(--text-2xs)", pad: "0 4px", min: 16 },
    md: { h: 20, font: "var(--text-xs)", pad: "0 6px", min: 20 },
  };
  const s = sizes[size];
  return (
    <kbd
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: s.font,
        fontWeight: 600,
        lineHeight: 1,
        height: s.h,
        minWidth: s.min,
        padding: s.pad,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-raised)",
        color: "var(--text)",
        border: "1px solid var(--border-strong)",
        borderBottomWidth: 2,
        borderRadius: "var(--radius-sm)",
        ...style,
      }}
    >
      {children}
    </kbd>
  );
}

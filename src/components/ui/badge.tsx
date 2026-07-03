import * as React from "react";

export type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";
type BadgeVariant = "soft" | "outline" | "solid";

interface BadgeProps {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  dot?: boolean;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const TONES: Record<BadgeTone, { fg: string; solidFg: string; muted: string; border: string; solid?: string }> = {
  neutral: { fg: "var(--text-muted)", solidFg: "var(--text)", muted: "var(--surface-raised)", border: "var(--border)" },
  green: { fg: "var(--green-fg)", solidFg: "#fff", muted: "var(--green-muted)", border: "var(--green-border)", solid: "var(--green-emphasis)" },
  amber: { fg: "var(--amber-fg)", solidFg: "#0d1117", muted: "var(--amber-muted)", border: "var(--amber-border)", solid: "var(--amber-fg)" },
  red: { fg: "var(--red-fg)", solidFg: "#fff", muted: "var(--red-muted)", border: "var(--red-border)", solid: "var(--red-emphasis)" },
  blue: { fg: "var(--blue-fg)", solidFg: "#fff", muted: "var(--blue-muted)", border: "var(--blue-border)", solid: "var(--blue-fg)" },
};

export function Badge({ tone = "neutral", variant = "soft", dot = false, icon = null, style = {}, children }: BadgeProps) {
  const t = TONES[tone];
  const solid = variant === "solid";
  const outline = variant === "outline";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 18,
        padding: "0 7px",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-medium)",
        lineHeight: 1,
        borderRadius: "var(--radius-sm)",
        color: solid ? t.solidFg : t.fg,
        background: solid ? t.solid || t.fg : outline ? "transparent" : t.muted,
        border: `1px solid ${solid ? "transparent" : t.border}`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: solid ? t.solidFg : t.fg, flexShrink: 0 }} />}
      {icon && <span style={{ display: "inline-flex", width: 11, height: 11, flexShrink: 0 }}>{icon}</span>}
      {children}
    </span>
  );
}

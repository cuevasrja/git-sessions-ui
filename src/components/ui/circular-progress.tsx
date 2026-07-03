import * as React from "react";

interface CircularProgressProps {
  value?: number | null;
  size?: number;
  stroke?: number;
  label?: string | null;
  tone?: "green" | "blue" | "amber";
  style?: React.CSSProperties;
}

export function CircularProgress({ value = null, size = 52, stroke = 5, label = null, tone = "green", style = {} }: CircularProgressProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const indeterminate = value === null;
  const pct = indeterminate ? 25 : Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const color = { green: "var(--green-fg)", blue: "var(--blue-fg)", amber: "var(--amber-fg)" }[tone];

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8, ...style }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)", animation: indeterminate ? "gs-spin 0.9s linear infinite" : "none" }}
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-raised)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            style={{ transition: indeterminate ? "none" : "stroke-dasharray var(--duration-slow) var(--ease-out)" }}
          />
        </svg>
        {!indeterminate && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              fontFamily: "var(--font-mono)",
              color: "var(--text)",
            }}
          >
            {Math.round(pct)}%
          </span>
        )}
      </div>
      {label && <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{label}</span>}
    </div>
  );
}

import * as React from "react";
import { Check } from "lucide-react";

interface StepperProps {
  steps: string[];
  current: number;
  style?: React.CSSProperties;
}

export function Stepper({ steps, current, style = {} }: StepperProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", ...style }}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const dot = done || active ? "var(--green-emphasis)" : "var(--surface-raised)";
        const dotBorder = done || active ? "transparent" : "var(--border-strong)";
        const dotFg = done || active ? "#fff" : "var(--text-subtle)";
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: dot,
                  border: `1px solid ${dotBorder}`,
                  color: dotFg,
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  transition: "background var(--duration-base)",
                }}
              >
                {done ? <Check style={{ width: 13, height: 13 }} /> : i + 1}
              </span>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: active ? "var(--weight-semibold)" : "var(--weight-regular)",
                  color: active ? "var(--text)" : done ? "var(--text-muted)" : "var(--text-subtle)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <span style={{ flex: 1, height: 1, margin: "0 12px", minWidth: 16, background: done ? "var(--green-border)" : "var(--border)" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

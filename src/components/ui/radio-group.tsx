"use client";

import * as React from "react";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  layout?: "segmented" | "cards";
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export function RadioGroup({ value, onChange, options, layout = "segmented", ariaLabel, style = {} }: RadioGroupProps) {
  if (layout === "cards") {
    return (
      <div role="radiogroup" aria-label={ariaLabel} style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "1fr", gap: 10, ...style }}>
        {options.map((o) => (
          <CardOption key={o.value} option={o} selected={o.value === value} onSelect={() => onChange(o.value)} />
        ))}
      </div>
    );
  }
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{ display: "inline-flex", padding: 3, gap: 2, background: "var(--canvas-inset)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", ...style }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              border: "none",
              borderRadius: "var(--radius-sm)",
              background: active ? "var(--surface-raised)" : "transparent",
              color: active ? "var(--text)" : "var(--text-muted)",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-md)",
              fontWeight: active ? "var(--weight-medium)" : "var(--weight-regular)",
              cursor: "pointer",
              transition: "background var(--duration-fast), color var(--duration-fast)",
            }}
          >
            {o.icon && <span style={{ display: "inline-flex", width: 15, height: 15 }}>{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function CardOption({ option, selected, onSelect }: { option: RadioOption; selected: boolean; onSelect: () => void }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
        padding: "12px 14px",
        textAlign: "left",
        background: selected ? "var(--blue-muted)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--blue-border)" : hover ? "var(--border-strong)" : "var(--border)"}`,
        borderRadius: "var(--radius-md)",
        color: "var(--text)",
        cursor: "pointer",
        transition: "border-color var(--duration-fast), background var(--duration-fast)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {option.icon && <span style={{ display: "inline-flex", width: 16, height: 16, flexShrink: 0 }}>{option.icon}</span>}
        <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-medium)" }}>{option.label}</span>
      </span>
      {option.description && <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: "var(--leading-snug)" }}>{option.description}</span>}
    </button>
  );
}

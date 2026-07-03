"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
}

export function Select({ value, onChange, options, placeholder = "Select…", disabled = false, size = "md", style = {} }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const heights = { sm: "var(--control-h-sm)", md: "var(--control-h-md)", lg: "var(--control-h-lg)" };
  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  React.useEffect(() => {
    if (open) setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
  }, [open, options, value]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          height: heights[size],
          padding: "0 10px",
          background: "var(--canvas-inset)",
          border: `1px solid ${open ? "var(--focus-ring)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)",
          boxShadow: open ? "0 0 0 2px var(--blue-muted)" : "none",
          color: selected ? "var(--text)" : "var(--text-subtle)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-md)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
        }}
      >
        {selected?.icon && <span style={{ display: "inline-flex", width: 16, height: 16, flexShrink: 0 }}>{selected.icon}</span>}
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : placeholder}</span>
        <ChevronDown style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 40,
            padding: 4,
            background: "var(--surface-raised)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {options.map((o, i) => (
            <OptionRow
              key={o.value}
              option={o}
              active={o.value === value}
              highlighted={i === highlight}
              onSelect={() => {
                onChange(o.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionRow({ option, active, highlighted, onSelect }: { option: SelectOption; active: boolean; highlighted: boolean; onSelect: () => void }) {
  return (
    <div
      role="option"
      aria-selected={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 8px",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        background: active ? "var(--blue-muted)" : highlighted ? "var(--surface)" : "transparent",
        color: active ? "var(--text-bright)" : "var(--text)",
        fontSize: "var(--text-md)",
      }}
    >
      {option.icon && <span style={{ display: "inline-flex", width: 16, height: 16, flexShrink: 0 }}>{option.icon}</span>}
      <span style={{ flex: 1 }}>{option.label}</span>
      {active && <Check style={{ width: 14, height: 14, color: "var(--blue-fg)" }} />}
    </div>
  );
}

import * as React from "react";

type SwitchTone = "green" | "amber" | "blue" | "red";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  tone?: SwitchTone;
  size?: "sm" | "md";
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export function Switch({ checked = false, onChange, disabled = false, tone = "green", size = "md", ariaLabel, style = {} }: SwitchProps) {
  const dims = size === "sm" ? { w: 32, h: 18, k: 14 } : { w: 38, h: 22, k: 18 };
  const trackOn: Record<SwitchTone, string> = {
    green: "var(--green-emphasis)",
    amber: "var(--amber-fg)",
    blue: "var(--blue-fg)",
    red: "var(--red-emphasis)",
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative",
        width: dims.w,
        height: dims.h,
        flexShrink: 0,
        padding: 0,
        border: "none",
        borderRadius: "var(--radius-full)",
        background: checked ? trackOn[tone] : "var(--gray-6)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background var(--duration-base) var(--ease-standard)",
        boxShadow: "var(--shadow-inset)",
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? dims.w - dims.k - 2 : 2,
          width: dims.k,
          height: dims.k,
          borderRadius: "var(--radius-full)",
          background: "#fff",
          boxShadow: "var(--shadow-sm)",
          transition: "left var(--duration-base) var(--ease-out)",
        }}
      />
    </button>
  );
}

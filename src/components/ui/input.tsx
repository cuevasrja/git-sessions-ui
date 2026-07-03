"use client";

import * as React from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  mono?: boolean;
  invalid?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  wrapStyle?: React.CSSProperties;
}

export function Input({ mono = false, invalid = false, prefix = null, suffix = null, size = "md", disabled = false, wrapStyle = {}, style = {}, ...rest }: InputProps) {
  const heights = { sm: "var(--control-h-sm)", md: "var(--control-h-md)", lg: "var(--control-h-lg)" };
  const [focus, setFocus] = React.useState(false);
  const borderColor = invalid ? "var(--red-fg)" : focus ? "var(--focus-ring)" : "var(--border)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: heights[size],
        background: "var(--canvas-inset)",
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius-sm)",
        boxShadow: focus ? `0 0 0 2px ${invalid ? "var(--red-muted)" : "var(--blue-muted)"}` : "none",
        transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
        opacity: disabled ? 0.5 : 1,
        overflow: "hidden",
        ...wrapStyle,
      }}
    >
      {prefix && <span style={{ display: "inline-flex", alignItems: "center", paddingLeft: 10, color: "var(--text-subtle)" }}>{prefix}</span>}
      <input
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          padding: "0 10px",
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text)",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          fontSize: mono ? "var(--text-sm)" : "var(--text-md)",
          ...style,
        }}
        {...rest}
      />
      {suffix && <span style={{ display: "inline-flex", alignItems: "center", paddingRight: 10, color: "var(--text-subtle)" }}>{suffix}</span>}
    </div>
  );
}

"use client";

import * as React from "react";

interface TooltipProps {
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Tooltip({ content, side = "top", children, style = {} }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = () => {
    timer.current = setTimeout(() => setOpen(true), 300);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  const pos: React.CSSProperties = {
    top: { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    left: { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
    right: { left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
  }[side];

  return (
    <span style={{ position: "relative", display: "inline-flex", ...style }} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 100,
            ...pos,
            maxWidth: 240,
            width: "max-content",
            padding: "6px 9px",
            background: "var(--surface-overlay)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            fontSize: "var(--text-xs)",
            lineHeight: "var(--leading-snug)",
            pointerEvents: "none",
            animation: "gs-tip-in var(--duration-fast) var(--ease-out)",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

"use client";

import * as React from "react";
import { AlertTriangle, XCircle } from "lucide-react";
import { ProviderIcon } from "./provider-icon";
import type { Health, Provider } from "@/lib/types";

const HEALTH: Record<Health, { color: string; rail: string; icon: React.ElementType | null }> = {
  ok: { color: "var(--health-ok)", rail: "transparent", icon: null },
  warn: { color: "var(--health-warn)", rail: "var(--health-warn)", icon: AlertTriangle },
  error: { color: "var(--health-error)", rail: "var(--health-error)", icon: XCircle },
};

interface SessionListItemProps {
  name: string;
  provider?: Provider;
  subtitle?: string | null;
  health?: Health;
  selected?: boolean;
  isDefault?: boolean;
  problemCount?: number;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const SessionListItem = React.forwardRef<HTMLButtonElement, SessionListItemProps>(function SessionListItem(
  { name, provider = "custom", subtitle = null, health = "ok", selected = false, isDefault = false, problemCount = 0, onClick, style = {} },
  ref,
) {
  const h = HEALTH[health];
  const railColor = selected ? "var(--blue-fg)" : h.rail;
  const Icon = h.icon;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-current={selected}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 12px 9px 13px",
        textAlign: "left",
        cursor: "pointer",
        background: selected ? "var(--selected-bg)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-md)",
        transition: "background var(--duration-fast)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = "var(--hover-bg)";
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = "transparent";
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "var(--ring-tight)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2, borderRadius: 2, background: railColor }} />
      <ProviderIcon provider={provider} size={18} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "var(--text-base)", fontWeight: "var(--weight-medium)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </span>
          {isDefault && (
            <span
              style={{
                fontSize: "var(--text-2xs)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-full)",
                padding: "0 5px",
                lineHeight: "15px",
                flexShrink: 0,
              }}
            >
              default
            </span>
          )}
        </span>
        {subtitle && (
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 2,
            }}
          >
            {subtitle}
          </span>
        )}
      </span>
      <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center" }}>
        {health === "ok" || !Icon ? (
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--health-ok)" }} />
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: h.color }}>
            <Icon style={{ width: 14, height: 14 }} />
            {problemCount > 0 && <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>{problemCount}</span>}
          </span>
        )}
      </span>
    </button>
  );
});

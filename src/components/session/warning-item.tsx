import * as React from "react";
import { AlertTriangle, Wrench, XCircle } from "lucide-react";
import type { Tone } from "@/lib/types";

interface WarningItemProps {
  tone?: Tone;
  title: string;
  detail?: string | null;
  suggestion?: string | null;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export function WarningItem({ tone = "warn", title, detail = null, suggestion = null, action = null, style = {} }: WarningItemProps) {
  const color = tone === "error" ? "var(--red-fg)" : "var(--amber-fg)";
  const bg = tone === "error" ? "var(--red-subtle)" : "var(--amber-subtle)";
  const Icon = tone === "error" ? XCircle : AlertTriangle;

  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 12px", background: bg, border: "1px solid var(--border)", borderLeft: `2px solid ${color}`, borderRadius: "var(--radius-md)", ...style }}>
      <Icon style={{ width: 16, height: 16, color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text)" }}>{title}</div>
        {detail && <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 3, wordBreak: "break-all" }}>{detail}</div>}
        {suggestion && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            <Wrench style={{ width: 12, height: 12 }} />
            <span>{suggestion}</span>
          </div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0, alignSelf: "center" }}>{action}</div>}
    </div>
  );
}

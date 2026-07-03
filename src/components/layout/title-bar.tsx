"use client";

import * as React from "react";
import { FlaskConical, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";

interface TitleBarProps {
  dryRun: boolean;
  onToggleDry: (value: boolean) => void;
  onReload: () => void;
  onNew: () => void;
  sessionCount: number;
}

export function TitleBar({ dryRun, onToggleDry, onReload, onNew, sessionCount }: TitleBarProps) {
  return (
    <header
      style={{
        height: "var(--titlebar-height)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 12px 0 14px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ position: "relative", width: 18, height: 18, display: "inline-block" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green-fg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="2.4" />
            <circle cx="6" cy="18" r="2.4" />
            <circle cx="18" cy="9" r="2.4" />
            <path d="M6 8.4v7.2" />
            <path d="M18 11.4c0 3.5-3 3.6-6 3.6" />
          </svg>
        </span>
        <span style={{ fontSize: "var(--text-md)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-tight)" }}>
          Git<span style={{ color: "var(--green-fg)" }}>Session</span>Manager
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginLeft: 2, borderLeft: "1px solid var(--border)", paddingLeft: 10 }}>{sessionCount} sessions</span>
      </div>

      <div style={{ flex: 1 }} />

      <Tooltip content="Preview all changes in modals without writing to disk." side="bottom">
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            background: dryRun ? "var(--amber-muted)" : "transparent",
            border: "1px solid " + (dryRun ? "var(--amber-border)" : "var(--border)"),
          }}
        >
          <FlaskConical style={{ width: 14, height: 14, color: dryRun ? "var(--amber-fg)" : "var(--text-muted)" }} />
          <span style={{ fontSize: "var(--text-sm)", color: dryRun ? "var(--amber-fg)" : "var(--text-muted)", fontWeight: "var(--weight-medium)" }}>Dry-run</span>
          <Switch checked={dryRun} onChange={onToggleDry} tone="amber" size="sm" />
        </label>
      </Tooltip>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Tooltip
          content={
            <span>
              Reload from disk <Kbd size="sm">r</Kbd>
            </span>
          }
          side="bottom"
        >
          <IconButton icon={<RotateCw style={{ width: "100%", height: "100%" }} />} aria-label="Reload from disk" onClick={onReload} />
        </Tooltip>
        <Button variant="primary" size="sm" kbd="n" icon={<Plus style={{ width: "100%", height: "100%" }} />} onClick={onNew}>
          New session
        </Button>
      </div>
    </header>
  );
}

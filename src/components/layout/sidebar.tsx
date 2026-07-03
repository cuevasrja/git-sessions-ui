"use client";

import * as React from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { SessionListItem } from "@/components/session/session-list-item";
import { Input } from "@/components/ui/input";
import type { Session } from "@/lib/types";

interface SidebarProps {
  sessions: Session[];
  selectedId: string;
  onSelect: (id: string) => void;
  itemRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

export function Sidebar({ sessions, selectedId, onSelect, itemRefs }: SidebarProps) {
  const [q, setQ] = React.useState("");
  const def = sessions.find((s) => s.id === "default");
  const rest = sessions.filter((s) => s.id !== "default" && s.name.toLowerCase().includes(q.toLowerCase()));

  const subtitleFor = (s: Session) => {
    if (s.problems.length) return s.problems[0].title.replace(/ —.*/, "");
    return s.alias ? `${s.alias} · ${s.email}` : s.email;
  };

  return (
    <nav style={{ width: "var(--sidebar-width)", flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
      <div style={{ padding: "10px 10px 8px" }}>
        <Input size="sm" placeholder="Filter sessions…" value={q} onChange={(e) => setQ(e.target.value)} prefix={<Search style={{ width: 14, height: 14 }} />} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 8px" }}>
        {def && (
          <div style={{ padding: "0 6px" }}>
            <SessionListItem
              ref={(el) => {
                if (el) itemRefs.current.set(def.id, el);
              }}
              name={def.name}
              provider={def.provider}
              isDefault
              subtitle="~/.gitconfig · unconditional include"
              health={def.health}
              selected={selectedId === def.id}
              onClick={() => onSelect(def.id)}
            />
          </div>
        )}

        <div style={{ fontSize: "var(--text-2xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", color: "var(--text-subtle)", padding: "12px 12px 6px", fontFamily: "var(--font-mono)" }}>
          Discovered · {rest.length}
        </div>

        <div style={{ padding: "0 6px", display: "flex", flexDirection: "column", gap: 1 }}>
          {rest.map((s) => (
            <SessionListItem
              key={s.id}
              ref={(el) => {
                if (el) itemRefs.current.set(s.id, el);
              }}
              name={s.name}
              provider={s.provider}
              subtitle={subtitleFor(s)}
              health={s.health}
              problemCount={s.problems.length}
              selected={selectedId === s.id}
              onClick={() => onSelect(s.id)}
            />
          ))}
          {rest.length === 0 && <div style={{ padding: "12px", fontSize: "var(--text-sm)", color: "var(--text-subtle)", textAlign: "center" }}>No matches</div>}
        </div>
      </div>

      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-muted)", display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>
        <CornerDownLeft style={{ width: 12, height: 12 }} />
        <span>Navigate with j / k · Enter to focus detail</span>
      </div>
    </nav>
  );
}

import * as React from "react";
import { AlertTriangle, ArrowRight, FileCog, Folder, GitBranch, KeyRound, Lock, Pencil, Trash2, Unlink, Wrench, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CodeWell } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { WarningItem } from "@/components/session/warning-item";
import { ProviderIcon } from "@/components/session/provider-icon";
import type { Session } from "@/lib/types";

function KV({ k, v, mono = true, muted = false }: { k: string; v?: string; mono?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "5px 0" }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{k}</span>
      <span style={{ fontSize: "var(--text-sm)", color: muted ? "var(--text-subtle)" : "var(--text)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", textAlign: "right", wordBreak: "break-all" }}>
        {v || <span style={{ color: "var(--text-subtle)" }}>—</span>}
      </span>
    </div>
  );
}

const PROVIDER_NAMES: Record<string, string> = { github: "GitHub", gitlab: "GitLab", bitbucket: "Bitbucket", custom: "Custom host" };

interface DetailPaneProps {
  session: Session | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

export function DetailPane({ session, onEdit, onDelete }: DetailPaneProps) {
  if (!session) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "var(--text-subtle)" }}>
        <GitBranch style={{ width: 30, height: 30 }} />
        <div style={{ fontSize: "var(--text-md)" }}>Select a session</div>
      </div>
    );
  }

  const healthBadge =
    session.health === "ok" ? (
      <Badge tone="green" dot>
        Healthy
      </Badge>
    ) : session.health === "warn" ? (
      <Badge tone="amber" icon={<AlertTriangle style={{ width: "100%", height: "100%" }} />}>
        {session.problems.length} warning{session.problems.length > 1 ? "s" : ""}
      </Badge>
    ) : (
      <Badge tone="red" icon={<XCircle style={{ width: "100%", height: "100%" }} />}>
        {session.problems.length} problem{session.problems.length > 1 ? "s" : ""}
      </Badge>
    );

  const sshBody = session.alias
    ? `Host ${session.alias}\n    HostName ${session.host}\n    User ${session.sshUser}\n    IdentityFile ${session.keyPath}\n    IdentitiesOnly yes`
    : `# uses default identity\nHost ${session.host}\n    IdentityFile ${session.keyPath}`;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-md)",
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ProviderIcon provider={session.provider} size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-tight)" }}>{session.name}</h1>
            {healthBadge}
            {session.readOnly && (
              <Tooltip content="The unconditional [include] in ~/.gitconfig can't be edited here." side="bottom">
                <Badge tone="neutral" variant="outline" icon={<Lock style={{ width: "100%", height: "100%" }} />}>
                  Read-only
                </Badge>
              </Tooltip>
            )}
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: 3 }}>
            {PROVIDER_NAMES[session.provider] ?? "Custom host"}
            {session.alias ? (
              <>
                {" "}
                · <span style={{ fontFamily: "var(--font-mono)" }}>{session.alias}</span>
              </>
            ) : null}
          </div>
        </div>
        {!session.readOnly && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Button variant="secondary" size="sm" kbd="e" icon={<Pencil style={{ width: "100%", height: "100%" }} />} onClick={onEdit}>
              Edit
            </Button>
            <Button variant="danger-ghost" size="sm" kbd="d" icon={<Trash2 style={{ width: "100%", height: "100%" }} />} onClick={onDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        {session.problems.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {session.problems.map((p, i) => (
              <WarningItem
                key={i}
                tone={p.tone}
                title={p.title}
                detail={p.detail}
                suggestion={p.suggestion}
                action={
                  <Button size="sm" variant="secondary" icon={<Wrench style={{ width: "100%", height: "100%" }} />}>
                    Repair
                  </Button>
                }
              />
            ))}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr auto 1fr",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <Corr icon={Folder} label="gitdir" value={session.gitdir} />
          <Link ok />
          <Corr icon={FileCog} label="identity" value={session.readOnly ? "~/.gitconfig" : `~/.gitconfig.${session.name}`} />
          <Link ok={session.health !== "error"} tone={session.health === "error" ? "error" : "ok"} />
          <Corr icon={KeyRound} label="ssh key" value={session.keyPath} tone={session.health === "error" ? "error" : "ok"} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card eyebrow={session.readOnly ? "~/.gitconfig" : `~/.gitconfig.${session.name}`} title="Git identity" style={{ gridColumn: "1 / 2" }}>
            <KV k="email" v={session.email} />
            {!session.readOnly && <KV k="signingKey" v={session.signingKey} muted={!session.signingKey} />}
          </Card>

          <Card eyebrow="~/.gitconfig" title={session.readOnly ? "[include]" : "[includeIf] binding"} style={{ gridColumn: "2 / 3" }}>
            <KV k="condition" v={session.readOnly ? "unconditional" : `gitdir:${session.gitdir}`} />
            <KV k="path" v={session.readOnly ? "~/.gitconfig.local" : `~/.gitconfig.${session.name}`} />
          </Card>

          <Card eyebrow="~/.ssh/config" title="SSH host block" style={{ gridColumn: "1 / 3" }}>
            <CodeWell onCopy={() => {}}>{sshBody}</CodeWell>
            {session.alias && (
              <div style={{ marginTop: 12 }}>
                <CodeWell label="~/.gitconfig.{name} · url rewrite" onCopy={() => {}}>{`[url "git@${session.alias}:"]\n    insteadOf = git@${session.host}:`}</CodeWell>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Corr({ icon: Icon, label, value, tone = "ok" }: { icon: React.ElementType; label: string; value: string; tone?: "ok" | "error" }) {
  const color = tone === "error" ? "var(--red-fg)" : "var(--text-muted)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "var(--text-2xs)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", color: "var(--text-subtle)" }}>
        <Icon style={{ width: 12, height: 12, color }} />
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          color: tone === "error" ? "var(--red-fg)" : "var(--text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Link({ ok = true, tone = "ok" }: { ok?: boolean; tone?: "ok" | "error" }) {
  const color = tone === "error" ? "var(--red-fg)" : "var(--green-fg)";
  const Icon = ok ? ArrowRight : Unlink;
  return <Icon style={{ width: 15, height: 15, color: ok ? "var(--text-subtle)" : color, flexShrink: 0 }} />;
}

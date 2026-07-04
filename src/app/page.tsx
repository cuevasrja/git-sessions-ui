"use client";

import * as React from "react";
import { TitleBar } from "@/components/layout/title-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { DetailPane } from "@/components/layout/detail-pane";
import { CreateWizard } from "@/components/modals/create-wizard";
import { EditDialog } from "@/components/modals/edit-dialog";
import { DeleteDialog } from "@/components/modals/delete-dialog";
import { ToastStack } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { createSession, deleteSession, editSession, listSessions } from "@/lib/tauri";
import type { CreateSessionInput, EditSessionInput, Session } from "@/lib/types";

type ModalKind = "create" | "edit" | "delete" | null;

export default function Home() {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState("default");
  const [dryRun, setDryRun] = React.useState(false);
  const [modal, setModal] = React.useState<ModalKind>(null);
  const { toasts, push: pushToast, dismiss } = useToast();
  const itemRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const detailRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    const list = await listSessions();
    setSessions(list);
    setLoaded(true);
    return list;
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    listSessions().then((list) => {
      if (cancelled) return;
      setSessions(list);
      setLoaded(true);
      const firstReal = list.find((s) => s.id !== "default");
      setSelectedId(firstReal?.id ?? list[0]?.id ?? "default");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = sessions.find((s) => s.id === selectedId);

  const handleReload = React.useCallback(async () => {
    const list = await load();
    pushToast({ tone: "blue", title: "Reloaded from disk", description: `${list.length} sessions · ${new Date().toLocaleTimeString()}` });
  }, [load, pushToast]);

  const handleCreate = async (input: CreateSessionInput) => {
    try {
      const result = await createSession(input, dryRun);
      if (dryRun) {
        pushToast({ tone: "amber", title: "Dry-run — nothing written", description: `Would update ${result.changedFiles.join(" · ")}`, mono: true });
      } else {
        setSessions((s) => [...s, result.session]);
        setSelectedId(result.session.id);
        pushToast({ tone: "green", title: `Session "${result.session.name}" created`, description: "~/.gitconfig · ~/.ssh/config updated" });
      }
      setModal(null);
    } catch (err) {
      pushToast({ tone: "red", title: "Failed to create session", description: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleSave = async (input: EditSessionInput) => {
    try {
      const result = await editSession(input, dryRun);
      if (dryRun) {
        pushToast({ tone: "amber", title: "Dry-run — nothing written", description: `Would update ${result.changedFiles.join(" · ")}`, mono: true });
      } else {
        setSessions((ss) => ss.map((s) => (s.id === result.session.id ? result.session : s)));
        pushToast({ tone: "green", title: `Session "${result.session.name}" updated` });
      }
      setModal(null);
    } catch (err) {
      pushToast({ tone: "red", title: "Failed to save session", description: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleDelete = async (deleteKey: boolean) => {
    if (!selected) return;
    try {
      await deleteSession(selected.name, selected.alias, selected.keyPath, deleteKey, dryRun);
      if (dryRun) {
        pushToast({ tone: "amber", title: "Dry-run — nothing written", description: "Disable dry-run to apply changes." });
      } else {
        const name = selected.name;
        setSessions((ss) => ss.filter((s) => s.id !== selectedId));
        setSelectedId("default");
        pushToast({ tone: "red", title: `Session "${name}" deleted`, description: deleteKey ? "Config + SSH key removed" : "Config removed · key kept" });
      }
      setModal(null);
    } catch (err) {
      pushToast({ tone: "red", title: "Failed to delete session", description: err instanceof Error ? err.message : String(err) });
    }
  };

  useKeyboardShortcuts({
    sessions,
    selectedId,
    setSelectedId,
    selected,
    modalOpen: modal !== null,
    onNew: () => setModal("create"),
    onReload: handleReload,
    onEdit: () => selected && !selected.readOnly && setModal("edit"),
    onDelete: () => selected && !selected.readOnly && setModal("delete"),
    onFocusDetail: () => detailRef.current?.focus(),
  });

  React.useEffect(() => {
    const el = itemRefs.current.get(selectedId);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (!loaded) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--canvas)", color: "var(--text-subtle)" }}>
        Loading sessions…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--canvas)", color: "var(--text)" }}>
      <TitleBar dryRun={dryRun} onToggleDry={setDryRun} onReload={handleReload} onNew={() => setModal("create")} sessionCount={sessions.length} />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar sessions={sessions} selectedId={selectedId} onSelect={setSelectedId} itemRefs={itemRefs} />
        <div ref={detailRef} tabIndex={-1} style={{ flex: 1, display: "flex", outline: "none" }}>
          <DetailPane session={selected} onEdit={() => setModal("edit")} onDelete={() => setModal("delete")} />
        </div>
      </div>

      <CreateWizard
        open={modal === "create"}
        dryRun={dryRun}
        onClose={() => setModal(null)}
        onCreate={handleCreate}
        onCopyPublicKey={() => pushToast({ tone: "blue", title: "Copied to clipboard" })}
      />
      <EditDialog open={modal === "edit"} dryRun={dryRun} session={selected} onClose={() => setModal(null)} onSave={handleSave} />
      <DeleteDialog open={modal === "delete"} dryRun={dryRun} session={selected} onCancel={() => setModal(null)} onConfirm={handleDelete} />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

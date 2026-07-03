"use client";

import * as React from "react";
import { closeWindow } from "@/lib/tauri";
import type { Session } from "@/lib/types";

interface UseKeyboardShortcutsArgs {
  sessions: Session[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  selected: Session | undefined;
  modalOpen: boolean;
  onNew: () => void;
  onReload: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFocusDetail: () => void;
}

/** Global, TUI-style shortcuts: n new, r reload, q quit, j/k or arrows to
 * navigate, Enter/l to focus the detail pane, e edit, d delete. */
export function useKeyboardShortcuts({ sessions, selectedId, setSelectedId, selected, modalOpen, onNew, onReload, onEdit, onDelete, onFocusDetail }: UseKeyboardShortcutsArgs) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const idx = sessions.findIndex((s) => s.id === selectedId);

      if (e.key === "n") {
        e.preventDefault();
        onNew();
      } else if (e.key === "r") {
        e.preventDefault();
        onReload();
      } else if (e.key === "q") {
        e.preventDefault();
        void closeWindow();
      } else if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = sessions[Math.min(idx + 1, sessions.length - 1)];
        if (next) setSelectedId(next.id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = sessions[Math.max(idx - 1, 0)];
        if (prev) setSelectedId(prev.id);
      } else if (e.key === "Enter" || e.key === "l") {
        e.preventDefault();
        onFocusDetail();
      } else if (e.key === "e" && selected && !selected.readOnly) {
        e.preventDefault();
        onEdit();
      } else if (e.key === "d" && selected && !selected.readOnly) {
        e.preventDefault();
        onDelete();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sessions, selectedId, setSelectedId, selected, modalOpen, onNew, onReload, onEdit, onDelete, onFocusDetail]);
}

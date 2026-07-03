"use client";

import * as React from "react";
import type { ToastItem, ToastTone } from "@/lib/types";

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((toast: { tone: ToastTone; title: string; description?: string; mono?: boolean }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, ...toast }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((ts) => ts.filter((x) => x.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

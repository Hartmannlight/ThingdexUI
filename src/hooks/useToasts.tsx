import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";

export type ToastKind = "success" | "warning" | "error" | "info";

export type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
};

type ToastContextValue = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
  success: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastsContext = createContext<ToastContextValue | null>(null);

const createId = () => Math.random().toString(36).slice(2, 10);

export const ToastsProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { play } = useAudioFeedback();

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = createId();
      const next = { ...toast, id };
      setToasts((current) => [...current, next]);
      if (toast.kind === "success") play("success");
      if (toast.kind === "warning") play("warning");
      if (toast.kind === "error") play("error");
      if (toast.kind === "info") play("info");
      window.setTimeout(() => remove(id), 5000);
    },
    [play, remove]
  );

  const helpers = useMemo(
    () => ({
      success: (title: string, message?: string) => push({ kind: "success", title, message }),
      warning: (title: string, message?: string) => push({ kind: "warning", title, message }),
      error: (title: string, message?: string) => push({ kind: "error", title, message }),
      info: (title: string, message?: string) => push({ kind: "info", title, message })
    }),
    [push]
  );

  const value = useMemo(
    () => ({
      toasts,
      push,
      remove,
      ...helpers
    }),
    [helpers, push, remove, toasts]
  );

  return <ToastsContext.Provider value={value}>{children}</ToastsContext.Provider>;
};

export const useToasts = () => {
  const context = useContext(ToastsContext);
  if (!context) {
    throw new Error("useToasts must be used within ToastsProvider");
  }
  return context;
};

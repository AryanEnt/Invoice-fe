"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { Toaster, toast } from "sonner";

interface ToastContextValue {
  notify: (message: string, tone?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const notify = useCallback((message: string, tone: "success" | "error" = "success") => {
    if (tone === "error") {
      toast.error(message);
      return;
    }
    toast.success(message);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="bottom-right"
        closeButton
        toastOptions={{
          classNames: {
            toast: "rounded-2xl border border-border bg-surface text-foreground",
            success: "border-border",
            error: "border-border",
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { CHART_HEIGHT } from "./chart-theme";

function subscribe() {
  return () => undefined;
}

function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  loading = false,
  error,
  empty,
  emptyMessage,
  children,
}: ChartCardProps) {
  const mounted = useIsClient();

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
      </header>
      <div className="min-w-0 p-5" style={{ minHeight: CHART_HEIGHT }}>
        {loading || !mounted ? (
          <div
            className="animate-pulse rounded-lg bg-muted-soft"
            style={{ height: CHART_HEIGHT - 24 }}
            aria-hidden
          />
        ) : error ? (
          <p role="alert" className="text-sm text-primary">
            {error}
          </p>
        ) : empty ? (
          <p className="text-sm text-muted">{emptyMessage}</p>
        ) : (
          <div className="w-full min-w-0" style={{ height: CHART_HEIGHT - 24 }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

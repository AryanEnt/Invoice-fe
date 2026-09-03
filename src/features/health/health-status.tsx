"use client";

import { useHealth } from "@/hooks/use-health";

export function HealthStatus() {
  const { status, data, error } = useHealth();

  if (status === "loading") {
    return (
      <section aria-busy="true" aria-live="polite" className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm font-medium text-muted">Checking API status…</p>
        <div className="mt-4 h-2 w-40 animate-pulse rounded bg-muted-soft" />
      </section>
    );
  }

  if (status === "error") {
    return (
      <section role="alert" className="rounded-2xl border border-border bg-primary-soft p-6">
        <h2 className="text-sm font-semibold text-primary">API unavailable</h2>
        <p className="mt-2 text-sm text-foreground">{error}</p>
        <p className="mt-3 text-xs text-muted">
          Start the backend with <code className="font-mono">npm run dev</code> in{" "}
          <code className="font-mono">/be</code>.
        </p>
      </section>
    );
  }

  const databaseConnected = data?.database === "connected";

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">System status</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <StatusItem label="API" value={data?.service ?? "unknown"} ok />
        <StatusItem label="Database" value={data?.database ?? "unknown"} ok={databaseConnected} />
        <StatusItem label="Checked at" value={formatTimestamp(data?.timestamp)} />
      </dl>
      {!databaseConnected ? (
        <p className="mt-4 text-xs text-warning">
          The API is running, but PostgreSQL is not connected. Start the database and run Prisma
          migrations.
        </p>
      ) : null}
    </section>
  );
}

function StatusItem({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">
        {ok === undefined ? (
          value
        ) : (
          <span className={ok ? "text-success" : "text-warning"}>{value}</span>
        )}
      </dd>
    </div>
  );
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "success";
}

const valueTones = {
  default: "text-foreground",
  warning: "text-warning",
  success: "text-success",
};

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${valueTones[tone]}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </article>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted-soft ${className}`} aria-hidden />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="grid gap-4 px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }, (_, col) => (
              <Skeleton key={col} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className = "h-28" }: { className?: string }) {
  return <Skeleton className={`w-full rounded-2xl border border-border ${className}`} />;
}

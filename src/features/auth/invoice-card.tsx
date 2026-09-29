export function InvoiceCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-auth-border bg-auth-card p-5 shadow-[0_12px_32px_rgb(26_32_39/0.08)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-auth-ink">Invoice #0192</p>
          <p className="mt-0.5 text-xs text-auth-muted">Bright &amp; Co.</p>
        </div>
        <span className="-rotate-[9deg] rounded-md border-2 border-auth-green px-2 py-0.5 text-xs font-extrabold tracking-[0.15em] text-auth-green">
          PAID
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        <div className="h-2 w-full rounded-full bg-auth-panel" />
        <div className="h-2 w-4/5 rounded-full bg-auth-panel" />
        <div className="h-2 w-3/5 rounded-full bg-auth-panel" />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-dashed border-auth-border pt-4">
        <span className="text-xs font-medium text-auth-muted">Total</span>
        <span className="text-lg font-bold text-auth-ink">$2,480</span>
      </div>
    </div>
  );
}

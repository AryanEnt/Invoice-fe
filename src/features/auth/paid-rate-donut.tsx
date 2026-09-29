const PAID_ON_TIME_PERCENT = 78;

export function PaidRateDonut({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-auth-border bg-auth-card p-4 shadow-[0_12px_32px_rgb(26_32_39/0.08)] ${className}`}
    >
      <div
        className="flex h-[88px] w-[88px] items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(var(--auth-green) 0 ${PAID_ON_TIME_PERCENT}%, var(--auth-border) ${PAID_ON_TIME_PERCENT}% 100%)`,
        }}
      >
        <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-auth-card text-lg font-extrabold text-auth-ink">
          {PAID_ON_TIME_PERCENT}%
        </span>
      </div>
      <p className="mt-3 text-center text-xs font-medium leading-snug text-auth-muted">
        Invoices paid on time
      </p>
    </div>
  );
}

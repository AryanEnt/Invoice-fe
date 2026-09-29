const CARD = "rounded-xl bg-white p-4 text-forest shadow-2xl";

export function ClientsKpiCard({ className = "" }: { className?: string }) {
  return (
    <div className={`${CARD} flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-leaf/15 text-leaf-dark">
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
          <circle cx="10" cy="7" r="3.25" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M3.75 16.25c.9-2.9 3.3-4.5 6.25-4.5s5.35 1.6 6.25 4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <div>
        <p className="text-[11px] font-semibold text-forest/60">Total Clients</p>
        <p className="text-xl font-extrabold leading-tight">128</p>
      </div>
    </div>
  );
}

const BARS = [38, 54, 32, 62, 48, 86];

export function CollectedCard({ className = "" }: { className?: string }) {
  return (
    <div className={`${CARD} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-extrabold leading-tight">$38.2k</p>
        <span className="rounded-full bg-leaf/15 px-1.5 py-0.5 text-[10px] font-bold text-leaf-dark">
          ↑ 15.8%
        </span>
      </div>
      <p className="text-[11px] text-forest/60">collected this month</p>
      <div className="mt-3 flex h-12 items-end gap-1.5" aria-hidden>
        {BARS.map((height, index) => (
          <span
            key={index}
            className={`flex-1 rounded-t-[3px] ${
              index === BARS.length - 1 ? "bg-leaf" : "bg-forest/15"
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

const STATUSES = [
  { label: "Paid", count: 42, pill: "bg-leaf/15 text-leaf-dark" },
  { label: "Pending", count: 9, pill: "bg-amber-100 text-amber-700" },
  { label: "Overdue", count: 3, pill: "bg-red-100 text-red-700" },
];

export function StatusCard({ className = "" }: { className?: string }) {
  return (
    <div className={`${CARD} ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-forest/50">
        Invoice status
      </p>
      <ul className="mt-2.5 space-y-2">
        {STATUSES.map((status) => (
          <li key={status.label} className="flex items-center justify-between gap-3">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.pill}`}>
              {status.label}
            </span>
            <span className="text-sm font-bold">{status.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

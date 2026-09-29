const LINE_ITEMS = [
  { description: "Brand identity design", amount: "$2,400" },
  { description: "Website landing page", amount: "$1,850" },
  { description: "Hosting setup (1 year)", amount: "$600" },
];

export function InvoiceCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-white p-5 text-forest shadow-2xl ${className}`}>
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-forest/50">
              Invoice
            </p>
            <p className="text-base font-bold">#INV-2041</p>
          </div>
          <p className="text-right text-[11px] text-forest/60">
            Due
            <span className="block text-xs font-semibold text-forest">Oct 12, 2026</span>
          </p>
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forest/50">
            Billed to
          </p>
          <p className="text-sm font-semibold">Northwind Studio</p>
        </div>

        <ul className="mt-3 space-y-1.5 border-t border-forest/10 pt-3">
          {LINE_ITEMS.map((item) => (
            <li key={item.description} className="flex justify-between gap-3 text-xs">
              <span className="text-forest/70">{item.description}</span>
              <span className="font-semibold">{item.amount}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-baseline justify-between border-t border-forest/10 pt-3">
          <span className="text-xs font-semibold text-forest/60">Total</span>
          <span className="text-xl font-extrabold">$4,850</span>
        </div>

        <span className="absolute right-0 top-12 -rotate-12 rounded-md border-2 border-leaf px-2.5 py-0.5 text-sm font-extrabold tracking-[0.2em] text-leaf">
          PAID
        </span>
      </div>
    </div>
  );
}

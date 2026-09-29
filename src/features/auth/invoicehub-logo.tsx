export function InvoiceHubLogo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-leaf-dark">
      <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8" aria-hidden>
        <path
          d="M8 3.5h11.5L26 10v16.5A2 2 0 0 1 24 28.5H8a2 2 0 0 1-2-2v-21a2 2 0 0 1 2-2Z"
          fill="currentColor"
        />
        <path d="M19.5 3.5V10H26" fill="#ffffff" fillOpacity="0.35" />
        <path
          d="M11 15h10M11 19.5h10M11 24h6"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[32px] font-bold leading-none tracking-tight">invoicehub</span>
    </span>
  );
}

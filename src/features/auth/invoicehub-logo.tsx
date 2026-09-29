import { DocumentIcon } from "./auth-icons";

export function InvoiceHubLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-auth-green text-white">
        <DocumentIcon className="h-5 w-5" />
      </span>
      <span className="text-[22px] font-bold tracking-tight text-auth-ink">InvoiceHub</span>
    </div>
  );
}

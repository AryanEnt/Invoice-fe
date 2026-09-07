"use client";

import { DropdownMenu, type DropdownItem } from "@/components/ui/dropdown-menu";
import type { Invoice } from "@/types/invoice";

export function InvoiceRowActions({
  invoice,
  canSend,
  canUpdate,
  canDelete,
  copyBusy,
  onView,
  onCopyLink,
  onSendEmail,
  onEdit,
  onDelete,
}: {
  invoice: Invoice;
  canSend: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  copyBusy: boolean;
  onView: () => void;
  onCopyLink: () => void;
  onSendEmail: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const items: DropdownItem[] = [
    { label: "View Invoice", onClick: onView },
    {
      label: copyBusy ? "Copying…" : "Copy Invoice Link",
      onClick: onCopyLink,
      disabled: copyBusy,
    },
  ];

  if (canSend && invoice.status !== "CANCELLED") {
    items.push({
      label: invoice.emailStatus === "FAILED" ? "Retry Email" : "Send Email",
      onClick: onSendEmail,
      disabled: !invoice.customer.email,
    });
  }

  if (canUpdate && invoice.status === "DRAFT") {
    items.push({ label: "Edit Invoice", onClick: onEdit });
  }

  if (canDelete && invoice.status === "DRAFT" && onDelete) {
    items.push({ label: "Delete Invoice", onClick: onDelete, danger: true });
  }

  return (
    <div className="flex items-center justify-end gap-1 opacity-80 transition-opacity duration-150 group-hover:opacity-100">
      <button
        type="button"
        className="inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-foreground hover:bg-muted-soft"
        aria-label={`View ${invoice.invoiceNumber}`}
        onClick={(event) => {
          event.stopPropagation();
          onView();
        }}
      >
        View
      </button>
      <DropdownMenu label="•••" ariaLabel={`More actions for ${invoice.invoiceNumber}`} items={items} />
    </div>
  );
}

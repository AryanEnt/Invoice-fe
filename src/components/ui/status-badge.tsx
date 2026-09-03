const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  UNPAID: "Unpaid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NONE: "—",
  NOT_SENT: "Not Sent",
  SENDING: "Sending",
  NEW: "NEW",
  OLD: "OLD",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "border-border bg-muted-soft text-muted",
  SENT: "border-border bg-primary-soft text-primary",
  VIEWED: "border-border bg-muted-soft text-foreground",
  PENDING: "border-border bg-muted-soft text-muted",
  PARTIALLY_PAID: "border-border bg-warning-soft text-warning",
  PAID: "border-border bg-success-soft text-success",
  UNPAID: "border-border bg-muted-soft text-foreground",
  OVERDUE: "border-border bg-primary-soft text-primary",
  CANCELLED: "border-border bg-muted-soft text-muted",
  COMPLETED: "border-border bg-success-soft text-success",
  FAILED: "border-border bg-primary-soft text-primary",
  REFUNDED: "border-border bg-muted-soft text-foreground",
  ACTIVE: "border-border bg-success-soft text-success",
  INACTIVE: "border-border bg-muted-soft text-muted",
  NONE: "border-border bg-muted-soft text-muted",
  NOT_SENT: "border-border bg-muted-soft text-muted",
  SENDING: "border-border bg-warning-soft text-warning",
  NEW: "border-border bg-primary-soft text-primary",
  OLD: "border-border bg-muted-soft text-muted",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function StatusBadge({ status, title }: { status: string; title?: string }) {
  const key = status.toUpperCase();
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[key] ?? "border-border bg-muted-soft text-foreground"
      } ${title ? "cursor-default" : ""}`}
    >
      {statusLabel(status)}
    </span>
  );
}

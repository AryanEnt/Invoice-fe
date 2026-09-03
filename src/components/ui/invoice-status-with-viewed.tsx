import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";

export function formatViewedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 16).replace("T", " ");
  }
  const datePart = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} at ${timePart}`;
}

export function InvoiceStatusWithViewed({
  status,
  viewedAt,
  className,
  align = "start",
}: {
  status: string;
  viewedAt?: string | null;
  className?: string;
  align?: "start" | "end" | "center";
}) {
  const showViewedAt = Boolean(viewedAt) && status.toUpperCase() === "VIEWED";

  return (
    <div
      className={cn(
        "inline-flex flex-col gap-1",
        align === "end" && "items-end",
        align === "center" && "items-center",
        align === "start" && "items-start",
        className,
      )}
    >
      <StatusBadge status={status} />
      {showViewedAt && viewedAt ? (
        <p className="text-[11px] leading-tight text-muted tabular-nums">
          {formatViewedAt(viewedAt)}
        </p>
      ) : null}
    </div>
  );
}

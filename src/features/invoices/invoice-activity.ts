import type { Invoice } from "@/types/invoice";

export function formatInvoiceDay(iso: string): string {
  const date = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/** Compact: "Sep 06 · 2:17 PM" — only when a real timestamp exists. */
export function formatActivityStamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

export function formatActivityStampLong(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

export function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function invoiceEmailAt(invoice: Invoice): string | null {
  return invoice.emailSentAt ?? invoice.sentAt ?? null;
}

export function invoicePaidAt(invoice: Invoice): string | null {
  const completed = (invoice.payments ?? [])
    .filter((payment) => payment.status === "COMPLETED" && payment.paidAt)
    .sort((a, b) => String(b.paidAt).localeCompare(String(a.paidAt)));
  return completed[0]?.paidAt ?? null;
}

export type TimelineEvent = {
  key: string;
  label: string;
  at: string | null;
};

export function buildInvoiceTimeline(invoice: Invoice): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { key: "created", label: "Created", at: invoice.createdAt },
  ];

  const emailAt = invoiceEmailAt(invoice);
  if (invoice.emailStatus === "FAILED") {
    events.push({ key: "email_failed", label: "Email failed", at: emailAt });
  } else if (invoice.emailStatus === "SENT" || emailAt) {
    events.push({ key: "email_sent", label: "Email sent", at: emailAt });
  }

  if (invoice.viewedAt) {
    events.push({ key: "viewed", label: "Viewed by customer", at: invoice.viewedAt });
  }

  if (invoice.status === "PAID" || invoice.paymentStatus === "PAID") {
    events.push({ key: "paid", label: "Paid", at: invoicePaidAt(invoice) });
  }

  return events;
}

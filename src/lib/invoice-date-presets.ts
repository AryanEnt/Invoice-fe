export const INVOICE_DATE_PRESETS = [
  "today",
  "this_week",
  "this_month",
  "last_month",
  "last_3_months",
  "this_year",
  "all_time",
  "custom",
] as const;

export type InvoiceDatePreset = (typeof INVOICE_DATE_PRESETS)[number];

export const INVOICE_DATE_PRESET_LABELS: Record<InvoiceDatePreset, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  last_month: "Last Month",
  last_3_months: "Last 3 Months",
  this_year: "This Year",
  all_time: "All Time",
  custom: "Custom Range",
};

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addUtcDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function toDateInput(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Inclusive YYYY-MM-DD bounds for the existing invoice list `invoiceDate` filter. */
export function resolveInvoiceDatePreset(
  preset: InvoiceDatePreset,
  customFrom?: string,
  customTo?: string,
  now = new Date(),
): { dateFrom?: string; dateTo?: string } {
  const today = startOfUtcDay(now);

  if (preset === "all_time") {
    return {};
  }

  if (preset === "custom") {
    if (!customFrom || !customTo) {
      return {};
    }
    return { dateFrom: customFrom, dateTo: customTo };
  }

  if (preset === "today") {
    const day = toDateInput(today);
    return { dateFrom: day, dateTo: day };
  }

  if (preset === "this_week") {
    const weekday = today.getUTCDay();
    const mondayOffset = weekday === 0 ? 6 : weekday - 1;
    const start = addUtcDays(today, -mondayOffset);
    const end = addUtcDays(start, 6);
    return { dateFrom: toDateInput(start), dateTo: toDateInput(end) };
  }

  if (preset === "this_month") {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const end = addUtcDays(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)),
      -1,
    );
    return { dateFrom: toDateInput(start), dateTo: toDateInput(end) };
  }

  if (preset === "last_month") {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const end = addUtcDays(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
      -1,
    );
    return { dateFrom: toDateInput(start), dateTo: toDateInput(end) };
  }

  if (preset === "last_3_months") {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2, 1));
    return { dateFrom: toDateInput(start), dateTo: toDateInput(today) };
  }

  const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  return { dateFrom: toDateInput(start), dateTo: toDateInput(today) };
}

import { formatMoney } from "@/lib/invoice-calc";
import type { Invoice } from "@/types/invoice";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatInvoiceCopy(invoice: Invoice): string {
  const customer = invoice.customer.company
    ? `${invoice.customer.name} (${invoice.customer.company})`
    : invoice.customer.name;
  const items = invoice.items
    .map(
      (item) =>
        `${item.description} — ${item.quantity} × ${formatMoney(item.unitPrice, invoice.currency)}`,
    )
    .join("\n");

  return [
    `Invoice: ${invoice.invoiceNumber}`,
    `Customer: ${customer}`,
    `Invoice Date: ${formatDate(invoice.invoiceDate)}`,
    `Due Date: ${formatDate(invoice.dueDate)}`,
    "",
    "Items:",
    items,
    "",
    `Subtotal: ${formatMoney(invoice.subtotal, invoice.currency)}`,
    `Tax: ${formatMoney(invoice.taxAmount, invoice.currency)}`,
    `Total: ${formatMoney(invoice.total, invoice.currency)}`,
  ].join("\n");
}

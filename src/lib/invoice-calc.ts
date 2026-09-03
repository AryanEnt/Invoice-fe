import Decimal from "decimal.js";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

function money(value: string): Decimal {
  return new Decimal(value || "0");
}

function moneyString(value: Decimal): string {
  return value.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4);
}

export interface InvoiceLineInput {
  quantity: string;
  unitPrice: string;
}

export interface InvoiceTotals {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
}

export function calculateLineAmount(quantity: string, unitPrice: string): string {
  const qty = money(quantity);
  const price = money(unitPrice);
  if (qty.lte(0)) {
    return "0.0000";
  }
  if (price.lt(0)) {
    return "0.0000";
  }
  return moneyString(qty.times(price));
}

export function calculateInvoiceTotals(lines: InvoiceLineInput[]): InvoiceTotals {
  let subtotal = new Decimal(0);

  for (const line of lines) {
    const quantity = money(line.quantity);
    const unitPrice = money(line.unitPrice);
    if (quantity.lte(0)) {
      throw new Error("Quantity must be greater than 0");
    }
    if (unitPrice.lt(0)) {
      throw new Error("Unit price cannot be negative");
    }
    subtotal = subtotal.plus(quantity.times(unitPrice));
  }

  const subtotalValue = moneyString(subtotal);

  return {
    subtotal: subtotalValue,
    discountAmount: "0.0000",
    taxAmount: "0.0000",
    total: subtotalValue,
  };
}

export function formatMoney(value: string, currency = "USD"): string {
  const amount = new Decimal(value || "0");
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.length === 3 ? currency : "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount.toFixed(2)));
}

import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals, calculateLineAmount } from "./invoice-calc";

describe("frontend invoice preview totals", () => {
  it("calculates subtotal and total from quantity times unit price", () => {
    const totals = calculateInvoiceTotals([
      { quantity: "2", unitPrice: "500" },
      { quantity: "1", unitPrice: "25" },
    ]);

    expect(totals.subtotal).toBe("1025.0000");
    expect(totals.discountAmount).toBe("0.0000");
    expect(totals.taxAmount).toBe("0.0000");
    expect(totals.total).toBe("1025.0000");
  });

  it("calculates line amount from quantity and unit price", () => {
    expect(calculateLineAmount("2", "500")).toBe("1000.0000");
  });

  it("rejects zero or negative quantities", () => {
    expect(() => calculateInvoiceTotals([{ quantity: "0", unitPrice: "10" }])).toThrow(
      "Quantity must be greater than 0",
    );
    expect(() => calculateInvoiceTotals([{ quantity: "-1", unitPrice: "10" }])).toThrow(
      "Quantity must be greater than 0",
    );
  });
});

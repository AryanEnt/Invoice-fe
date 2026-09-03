"use client";

import { Field, TextInput } from "@/components/ui/field";
import { calculateLineAmount, formatMoney, type InvoiceTotals } from "@/lib/invoice-calc";
import type { InvoiceItemFormValues } from "@/types/invoice";

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3.5 5h9M6 5V3.6A.6.6 0 0 1 6.6 3h2.8a.6.6 0 0 1 .6.6V5M5.2 5l.4 7.2a.8.8 0 0 0 .8.7h3.2a.8.8 0 0 0 .8-.7L10.8 5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface InvoiceItemsSectionProps {
  items: InvoiceItemFormValues[];
  currency: string;
  totals: InvoiceTotals;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, patch: Partial<InvoiceItemFormValues>) => void;
}

export function InvoiceItemsSection({
  items,
  currency,
  totals,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: InvoiceItemsSectionProps) {
  return (
    <section className="rounded-[10px] border border-border bg-surface">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h3 className="text-sm font-semibold text-foreground">Invoice Items</h3>
        <p className="mt-1 text-sm text-muted">
          Add the products or services you are billing the customer.
        </p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium sm:px-5">Description</th>
              <th className="w-24 px-3 py-3 text-right font-medium">Qty</th>
              <th className="w-36 px-3 py-3 text-right font-medium">Unit Price</th>
              <th className="w-36 px-3 py-3 text-right font-medium">Amount</th>
              <th className="w-12 px-3 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const amount = calculateLineAmount(item.quantity, item.unitPrice);
              return (
                <tr key={`desktop-item-${index}`} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 sm:px-5">
                    <TextInput
                      id={`item-desc-${index}`}
                      value={item.description}
                      placeholder="e.g. Website development"
                      onChange={(event) => onUpdateItem(index, { description: event.target.value })}
                      required
                      aria-label={`Description for item ${index + 1}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <TextInput
                      id={`item-qty-${index}`}
                      type="number"
                      min="0.01"
                      step="any"
                      inputMode="decimal"
                      value={item.quantity}
                      onChange={(event) => onUpdateItem(index, { quantity: event.target.value })}
                      required
                      className="text-right"
                      aria-label={`Quantity for item ${index + 1}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <TextInput
                      id={`item-price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={item.unitPrice}
                      onChange={(event) => onUpdateItem(index, { unitPrice: event.target.value })}
                      required
                      className="text-right"
                      aria-label={`Unit price for item ${index + 1}`}
                    />
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums text-foreground">
                    {formatMoney(amount, currency)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-soft hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      title="Remove item"
                      aria-label="Remove item"
                      disabled={items.length === 1}
                      onClick={() => onRemoveItem(index)}
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {items.map((item, index) => {
          const amount = calculateLineAmount(item.quantity, item.unitPrice);
          return (
            <article
              key={`mobile-item-${index}`}
              className="rounded-[10px] border border-border bg-background p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Item {index + 1}
                </p>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-soft hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  title="Remove item"
                  aria-label="Remove item"
                  disabled={items.length === 1}
                  onClick={() => onRemoveItem(index)}
                >
                  <TrashIcon />
                </button>
              </div>
              <Field label="Description" htmlFor={`mobile-item-desc-${index}`} required>
                <TextInput
                  id={`mobile-item-desc-${index}`}
                  value={item.description}
                  placeholder="e.g. Website development"
                  onChange={(event) => onUpdateItem(index, { description: event.target.value })}
                  required
                />
              </Field>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Qty" htmlFor={`mobile-item-qty-${index}`} required>
                  <TextInput
                    id={`mobile-item-qty-${index}`}
                    type="number"
                    min="0.01"
                    step="any"
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(event) => onUpdateItem(index, { quantity: event.target.value })}
                    required
                  />
                </Field>
                <Field label="Unit Price" htmlFor={`mobile-item-price-${index}`} required>
                  <TextInput
                    id={`mobile-item-price-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(event) => onUpdateItem(index, { unitPrice: event.target.value })}
                    required
                  />
                </Field>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted">Amount</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatMoney(amount, currency)}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-5">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-border bg-muted-soft px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          onClick={onAddItem}
        >
          <span aria-hidden="true">+</span>
          Add Item
        </button>
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-5">
        <dl className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums text-foreground">{formatMoney(totals.subtotal, currency)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
            <dt className="text-base font-semibold text-foreground">Total</dt>
            <dd className="text-lg font-semibold tabular-nums text-foreground">
              {formatMoney(totals.total, currency)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

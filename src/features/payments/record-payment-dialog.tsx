"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import { useToast } from "@/providers/toast-provider";
import { recordPayment } from "@/services/payments.service";
import type { Invoice } from "@/types/invoice";
import type { RecordPaymentValues } from "@/types/payment";

interface RecordPaymentDialogProps {
  invoice: Invoice;
  onClose: () => void;
  onRecorded: (invoice: Invoice) => void;
}

const methods: RecordPaymentValues["method"][] = [
  "BANK_TRANSFER",
  "CASH",
  "CHECK",
  "OTHER",
];

export function RecordPaymentDialog({ invoice, onClose, onRecorded }: RecordPaymentDialogProps) {
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(invoice.balanceDue.replace(/\.?0+$/, "") || "");
  const [method, setMethod] = useState<RecordPaymentValues["method"]>("BANK_TRANSFER");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [providerTransactionId, setProviderTransactionId] = useState("");

  async function submit() {
    setBusy(true);
    try {
      const result = await recordPayment({
        invoiceId: invoice.id,
        amount,
        method,
        paidAt,
        notes,
        providerTransactionId,
      });
      notify("Payment recorded");
      onRecorded(result.invoice);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to record payment.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      title="Record payment"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button onClick={() => void submit()} disabled={busy || !amount}>
            Record
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Manual payment only. Stripe and PayPal are not connected.
        </p>
        <div className="grid gap-3 rounded-lg bg-muted-soft p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Total</p>
            <p className="mt-1 font-medium text-foreground">
              {formatMoney(invoice.total, invoice.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Paid</p>
            <p className="mt-1 font-medium text-foreground">
              {formatMoney(invoice.amountPaid, invoice.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Balance</p>
            <p className="mt-1 font-medium text-foreground">
              {formatMoney(invoice.balanceDue, invoice.currency)}
            </p>
          </div>
        </div>
        <Field label="Amount" htmlFor="pay-amount" required>
          <TextInput
            id="pay-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Method" htmlFor="pay-method">
            <SelectInput
              id="pay-method"
              value={method}
              onChange={(event) => setMethod(event.target.value as RecordPaymentValues["method"])}
            >
              {methods.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Payment date" htmlFor="pay-date">
            <TextInput
              id="pay-date"
              type="date"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Reference" htmlFor="pay-ref">
          <TextInput
            id="pay-ref"
            value={providerTransactionId}
            onChange={(event) => setProviderTransactionId(event.target.value)}
            placeholder="Check number or transfer ID"
          />
        </Field>
        <Field label="Notes" htmlFor="pay-notes">
          <TextArea
            id="pay-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}

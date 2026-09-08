"use client";

interface SendingEmailOverlayProps {
  open: boolean;
  invoiceNumber?: string;
  recipient?: string | null;
}

export function SendingEmailOverlay({ open, invoiceNumber, recipient }: SendingEmailOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="sending-email-title"
      aria-describedby="sending-email-desc"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5 flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-primary/20" aria-hidden />
            <span
              className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary"
              aria-hidden
            />
            <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
          </div>
          <h2 id="sending-email-title" className="text-base font-semibold text-foreground">
            Sending invoice
          </h2>
          <p id="sending-email-desc" className="mt-2 text-sm text-muted">
            {invoiceNumber
              ? `Preparing and emailing ${invoiceNumber}. This may take a moment.`
              : "Preparing and emailing the invoice. This may take a moment."}
          </p>
          {recipient ? (
            <p className="mt-3 w-full truncate rounded-lg bg-muted-soft px-3 py-2 text-xs text-muted">
              To {recipient}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

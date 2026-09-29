import type { ReactNode } from "react";
import { ClockIcon, SendIcon, ShieldIcon } from "./auth-icons";
import { InvoiceCard } from "./invoice-card";
import { PaidRateDonut } from "./paid-rate-donut";
import { ReminderCard } from "./reminder-card";

const FEATURES: { label: string; icon: ReactNode }[] = [
  { label: "Send fast", icon: <SendIcon className="h-4 w-4" /> },
  { label: "Auto reminders", icon: <ClockIcon className="h-4 w-4" /> },
  { label: "Secure data", icon: <ShieldIcon className="h-4 w-4" /> },
];

export function AuthIllustration() {
  return (
    <section
      aria-labelledby="auth-illustration-heading"
      className="relative hidden overflow-hidden bg-auth-panel min-[920px]:flex"
    >
      <div aria-hidden="true" className="auth-dot-grid absolute inset-0" />

      <div className="relative m-auto flex w-full max-w-[480px] flex-col items-center px-6 py-12">
        <div aria-hidden="true" className="relative h-[290px] w-full max-w-[430px]">
          <InvoiceCard className="absolute left-0 top-0 w-[250px]" />
          <PaidRateDonut className="absolute right-0 top-8 w-[150px]" />
          <ReminderCard className="absolute bottom-0 left-10 z-10 w-[280px]" />
        </div>

        <h2
          id="auth-illustration-heading"
          className="mt-12 text-center text-2xl font-extrabold tracking-tight text-auth-ink"
        >
          Get paid on time, every time
        </h2>
        <p className="mt-2 text-center text-[15px] text-auth-muted">
          Send invoices in minutes and let reminders do the chasing.
        </p>

        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {FEATURES.map((feature) => (
            <li key={feature.label} className="flex items-center gap-2 text-sm font-semibold text-auth-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-auth-border bg-auth-card text-auth-green">
                {feature.icon}
              </span>
              {feature.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

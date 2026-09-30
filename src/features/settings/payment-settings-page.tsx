"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import {
  getStripeGatewayStatus,
  type StripeGatewayStatus,
} from "@/services/settings.service";

export function PaymentSettingsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [stripe, setStripe] = useState<StripeGatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const stripeStatus = await getStripeGatewayStatus();
      setStripe(stripeStatus);
    } catch (error) {
      notify(error instanceof ApiError ? error.message : "Unable to load payment status.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!user) return <p className="text-sm text-muted">Loading payment status…</p>;
  if (user.role !== "SUPER_ADMIN") {
    return <p className="text-sm text-muted">Only Super Admin can view payment status.</p>;
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Payment gateways</h1>
        <p className="mt-1 text-sm text-muted">
          Gateway credentials are managed by the backend deployment environment. No account connection is required.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-1">
        <GatewayStatus
          name="Stripe Invoicing"
          connected={Boolean(stripe?.connected)}
          loading={loading}
          environment={stripe?.environment}
          detail={
            !stripe?.configured
              ? "Set STRIPE_SECRET_KEY and STRIPE_ACCOUNT_ID on the backend."
              : !stripe?.webhookConfigured
                ? "Set STRIPE_WEBHOOK_SECRET to sync paid invoices."
                : "Stripe emails invoices and hosts the payment page."
          }
        />
      </div>
    </section>
  );
}

function GatewayStatus({
  name,
  connected,
  loading,
  environment,
  detail,
}: {
  name: string;
  connected: boolean;
  loading: boolean;
  environment?: string;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-foreground">{name}</h2>
        <span className={connected ? "text-sm text-success" : "text-sm text-muted"}>
          {loading ? "Loading" : connected ? "Configured" : "Not configured"}
        </span>
      </div>
      {environment ? <p className="mt-2 text-xs uppercase text-muted">{environment}</p> : null}
      <p className="mt-3 text-sm text-muted">{detail}</p>
    </article>
  );
}

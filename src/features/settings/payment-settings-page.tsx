"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { getPayPalConnectUrl } from "@/services/settings.service";

type ProviderId = "stripe" | "paypal";

interface ProviderCard {
  id: ProviderId;
  title: string;
  methodLabel: string;
  description: string;
  accent: string;
}

const PROVIDERS: ProviderCard[] = [
  {
    id: "stripe",
    title: "Stripe",
    methodLabel: "Credit Cards",
    description:
      "Stripe is a simple and secure way to accept credit card payments online. Connect your account and begin accepting payments on invoices.",
    accent: "bg-[#635BFF]",
  },
  {
    id: "paypal",
    title: "PayPal",
    methodLabel: "PayPal",
    description:
      "PayPal is a leading online payment solution. Connect your account and start accepting PayPal payments on invoices.",
    accent: "bg-[#003087]",
  },
];

export function PaymentSettingsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [busyProvider, setBusyProvider] = useState<ProviderId | null>(null);
  const [enabledDefaults, setEnabledDefaults] = usePersistedFormState<{
    stripe: boolean;
    paypal: boolean;
  }>("settings:payment:defaults", { stripe: true, paypal: true });
  const [connections, setConnections] = usePersistedFormState<{
    stripe: boolean;
    paypal: boolean;
  }>("settings:payment:connections", { stripe: false, paypal: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    if (!code && !error) return;

    if (error) {
      notify(params.get("error_description") ?? "PayPal connection was cancelled.", "error");
    } else {
      setConnections((current) => ({ ...current, paypal: true }));
      notify("PayPal connected successfully.");
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("scope");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, [notify, setConnections]);

  if (!user) {
    return <p className="text-sm text-muted">Loading payment settings…</p>;
  }

  if (user.role !== "SUPER_ADMIN") {
    return <p className="text-sm text-muted">Only Super Admin can manage payment providers.</p>;
  }

  function toggleDefault(provider: ProviderId) {
    setEnabledDefaults((current) => ({
      ...current,
      [provider]: !current[provider],
    }));
  }

  async function handleConnect(provider: ProviderId) {
    if (provider === "paypal") {
      setBusyProvider("paypal");
      try {
        const { url } = await getPayPalConnectUrl();
        window.location.assign(url);
      } catch (err) {
        setBusyProvider(null);
        notify(err instanceof ApiError ? err.message : "Unable to start PayPal connect.", "error");
      }
      return;
    }

    setBusyProvider(provider);
    window.setTimeout(() => {
      setConnections((current) => ({ ...current, [provider]: true }));
      setBusyProvider(null);
      notify("Stripe marked as connected (UI only — live integration coming next).");
    }, 400);
  }

  function handleDisconnect(provider: ProviderId) {
    setBusyProvider(provider);
    window.setTimeout(() => {
      setConnections((current) => ({ ...current, [provider]: false }));
      setBusyProvider(null);
      notify(provider === "stripe" ? "Stripe disconnected." : "PayPal disconnected.");
    }, 250);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment methods"
        description="Choose which online payment providers are available for customer invoice payments."
      />

      <section className="rounded-2xl border border-border bg-surface px-5 py-5">
        <h2 className="text-sm font-semibold text-foreground">Default payment methods</h2>
        <p className="mt-1 text-sm text-muted">
          Select payment methods you want to enable on new invoices by default.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PROVIDERS.map((provider) => (
            <label
              key={provider.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition",
                enabledDefaults[provider.id]
                  ? "border-primary/40 bg-primary-soft/40"
                  : "border-border bg-surface hover:bg-muted-soft",
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary"
                checked={enabledDefaults[provider.id]}
                onChange={() => toggleDefault(provider.id)}
              />
              <span className="text-sm font-medium text-foreground">{provider.methodLabel}</span>
            </label>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const connected = connections[provider.id];
          const busy = busyProvider === provider.id;
          return (
            <section
              key={provider.id}
              className="flex flex-col rounded-2xl border border-border bg-surface px-5 py-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white",
                      provider.accent,
                    )}
                  >
                    {provider.id === "stripe" ? "S" : "P"}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{provider.title}</h3>
                    <p className="mt-0.5 text-xs text-muted">
                      {connected ? (
                        <span className="font-medium text-success">Connected</span>
                      ) : (
                        "Not connected"
                      )}
                    </p>
                  </div>
                </div>
                {connected ? (
                  <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success">
                    ✓ Connected
                  </span>
                ) : null}
              </div>

              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{provider.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {connected ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => handleDisconnect(provider.id)}
                  >
                    {busy ? "Updating…" : "Disconnect"}
                  </Button>
                ) : (
                  <Button type="button" disabled={busy} onClick={() => void handleConnect(provider.id)}>
                    {busy ? "Connecting…" : `Connect ${provider.title}`}
                  </Button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

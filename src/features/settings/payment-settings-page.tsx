"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import {
  disconnectPayPalGateway,
  disconnectStripeGateway,
  getPayPalGatewayStatus,
  getStripeGatewayStatus,
  startPayPalConnect,
  startStripeConnect,
  testPayPalGateway,
  testStripeGateway,
  type PayPalGatewayStatus,
  type StripeGatewayStatus,
} from "@/services/settings.service";

const PAYPAL_POPUP_MESSAGE = {
  connected: "paypal-connected",
  error: "paypal-error",
} as const;

const STRIPE_POPUP_MESSAGE = {
  connected: "stripe-connected",
  error: "stripe-error",
} as const;

type PayPalPopupMessage =
  | { type: typeof PAYPAL_POPUP_MESSAGE.connected }
  | { type: typeof PAYPAL_POPUP_MESSAGE.error; message?: string };

type StripePopupMessage =
  | { type: typeof STRIPE_POPUP_MESSAGE.connected }
  | { type: typeof STRIPE_POPUP_MESSAGE.error; message?: string };

function openCenteredPopup(name: string, width = 500, height = 700): Window | null {
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  return window.open(
    "about:blank",
    name,
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

export function PaymentSettingsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [paypalStatus, setPaypalStatus] = useState<PayPalGatewayStatus | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeGatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paypalUiState, setPaypalUiState] = useState<
    "idle" | "connecting" | "testing" | "disconnecting" | "error"
  >("idle");
  const [stripeUiState, setStripeUiState] = useState<
    "idle" | "connecting" | "testing" | "disconnecting" | "error"
  >("idle");
  const paypalPopupPollRef = useRef<number | null>(null);
  const paypalPopupRef = useRef<Window | null>(null);
  const stripePopupPollRef = useRef<number | null>(null);
  const stripePopupRef = useRef<Window | null>(null);

  const clearPayPalPopupWatch = useCallback(() => {
    if (paypalPopupPollRef.current != null) {
      window.clearInterval(paypalPopupPollRef.current);
      paypalPopupPollRef.current = null;
    }
    paypalPopupRef.current = null;
  }, []);

  const clearStripePopupWatch = useCallback(() => {
    if (stripePopupPollRef.current != null) {
      window.clearInterval(stripePopupPollRef.current);
      stripePopupPollRef.current = null;
    }
    stripePopupRef.current = null;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paypal, stripe] = await Promise.all([
        getPayPalGatewayStatus(),
        getStripeGatewayStatus(),
      ]);
      setPaypalStatus(paypal);
      setStripeStatus(stripe);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to load payment settings.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as PayPalPopupMessage | StripePopupMessage | null;
      if (!data || typeof data !== "object" || !("type" in data)) return;

      if (data.type === PAYPAL_POPUP_MESSAGE.connected) {
        const popup = paypalPopupRef.current;
        clearPayPalPopupWatch();
        try {
          popup?.close();
        } catch {
          /* ignore */
        }
        notify("PayPal connected successfully.");
        void load().then(() => setPaypalUiState("idle"));
        return;
      }

      if (data.type === PAYPAL_POPUP_MESSAGE.error) {
        const popup = paypalPopupRef.current;
        clearPayPalPopupWatch();
        try {
          popup?.close();
        } catch {
          /* ignore */
        }
        setPaypalUiState("error");
        notify(
          typeof data.message === "string" && data.message.trim()
            ? data.message
            : "PayPal connection failed. Please try again.",
          "error",
        );
        return;
      }

      if (data.type === STRIPE_POPUP_MESSAGE.connected) {
        const popup = stripePopupRef.current;
        clearStripePopupWatch();
        try {
          popup?.close();
        } catch {
          /* ignore */
        }
        notify("Stripe connected successfully.");
        void load().then(() => setStripeUiState("idle"));
        return;
      }

      if (data.type === STRIPE_POPUP_MESSAGE.error) {
        const popup = stripePopupRef.current;
        clearStripePopupWatch();
        try {
          popup?.close();
        } catch {
          /* ignore */
        }
        setStripeUiState("error");
        notify(
          typeof data.message === "string" && data.message.trim()
            ? data.message
            : "Stripe connection failed. Please try again.",
          "error",
        );
      }
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      clearPayPalPopupWatch();
      clearStripePopupWatch();
    };
  }, [clearPayPalPopupWatch, clearStripePopupWatch, load, notify]);

  if (!user) {
    return <p className="text-sm text-muted">Loading payment settings…</p>;
  }

  if (user.role !== "SUPER_ADMIN") {
    return <p className="text-sm text-muted">Only Super Admin can manage payment gateways.</p>;
  }

  async function handlePayPalConnect() {
    const popup = openCenteredPopup("paypal-connect");
    if (!popup) {
      setPaypalUiState("error");
      notify("Pop-up blocked. Allow pop-ups for InvoiceHub and try again.", "error");
      return;
    }

    paypalPopupRef.current = popup;
    setPaypalUiState("connecting");
    try {
      popup.document.write(
        "<!DOCTYPE html><title>Connecting to PayPal…</title><p style='font-family:system-ui;padding:24px'>Connecting to PayPal…</p>",
      );
    } catch {
      /* cross-document write may fail after navigation — ignore */
    }

    try {
      const result = await startPayPalConnect();
      if (!result.url) {
        throw new Error("PayPal did not return a login URL.");
      }
      if (popup.closed) {
        setPaypalUiState("idle");
        clearPayPalPopupWatch();
        return;
      }
      popup.location.href = result.url;

      if (paypalPopupPollRef.current != null) {
        window.clearInterval(paypalPopupPollRef.current);
      }
      paypalPopupPollRef.current = window.setInterval(() => {
        if (!paypalPopupRef.current || paypalPopupRef.current.closed) {
          clearPayPalPopupWatch();
          setPaypalUiState((current) => (current === "connecting" ? "idle" : current));
        }
      }, 500);
    } catch (err) {
      try {
        popup.close();
      } catch {
        /* ignore */
      }
      clearPayPalPopupWatch();
      setPaypalUiState("error");
      notify(
        err instanceof ApiError
          ? err.message
          : "PayPal connection failed. Please verify the PayPal Sandbox application and Return URL configuration.",
        "error",
      );
    }
  }

  async function handlePayPalTest() {
    setPaypalUiState("testing");
    try {
      const result = await testPayPalGateway();
      if (!result.connected) {
        setPaypalUiState("error");
        notify(
          result.message ??
            "PayPal connection failed. Please verify the PayPal application and reconnect.",
          "error",
        );
        return;
      }
      notify("PayPal connection verified.");
      await load();
      setPaypalUiState("idle");
    } catch (err) {
      setPaypalUiState("error");
      notify(
        err instanceof ApiError
          ? err.message
          : "PayPal connection failed. Please reconnect.",
        "error",
      );
    }
  }

  async function handlePayPalDisconnect() {
    if (!window.confirm("Disconnect the company PayPal account? Historical payments will be kept.")) {
      return;
    }
    setPaypalUiState("disconnecting");
    try {
      setPaypalStatus(await disconnectPayPalGateway());
      notify("PayPal disconnected.");
      setPaypalUiState("idle");
    } catch (err) {
      setPaypalUiState("error");
      notify(err instanceof ApiError ? err.message : "Unable to disconnect PayPal.", "error");
    }
  }

  async function handleStripeConnect() {
    const popup = openCenteredPopup("stripe-connect");
    if (!popup) {
      setStripeUiState("error");
      notify("Pop-up blocked. Allow pop-ups for InvoiceHub and try again.", "error");
      return;
    }

    stripePopupRef.current = popup;
    setStripeUiState("connecting");
    try {
      popup.document.write(
        "<!DOCTYPE html><title>Connecting to Stripe…</title><p style='font-family:system-ui;padding:24px'>Connecting to Stripe…</p>",
      );
    } catch {
      /* cross-document write may fail after navigation — ignore */
    }

    try {
      const result = await startStripeConnect();
      if (!result.url) {
        throw new Error("Stripe did not return a login URL.");
      }
      if (popup.closed) {
        setStripeUiState("idle");
        clearStripePopupWatch();
        return;
      }
      popup.location.href = result.url;

      if (stripePopupPollRef.current != null) {
        window.clearInterval(stripePopupPollRef.current);
      }
      stripePopupPollRef.current = window.setInterval(() => {
        if (!stripePopupRef.current || stripePopupRef.current.closed) {
          clearStripePopupWatch();
          setStripeUiState((current) => (current === "connecting" ? "idle" : current));
        }
      }, 500);
    } catch (err) {
      try {
        popup.close();
      } catch {
        /* ignore */
      }
      clearStripePopupWatch();
      setStripeUiState("error");
      notify(
        err instanceof ApiError
          ? err.message
          : "Stripe connection failed. Please verify the Stripe Connect application and Return URL configuration.",
        "error",
      );
    }
  }

  async function handleStripeTest() {
    setStripeUiState("testing");
    try {
      const result = await testStripeGateway();
      if (!result.connected) {
        setStripeUiState("error");
        notify(
          result.message ??
            "Stripe connection failed. Please verify the Stripe application and reconnect.",
          "error",
        );
        return;
      }
      notify("Stripe connection verified.");
      await load();
      setStripeUiState("idle");
    } catch (err) {
      setStripeUiState("error");
      notify(
        err instanceof ApiError
          ? err.message
          : "Stripe connection failed. Please reconnect.",
        "error",
      );
    }
  }

  async function handleStripeDisconnect() {
    if (
      !window.confirm(
        "Disconnect Stripe? Customers will no longer be able to use this Stripe connection to pay new invoices.",
      )
    ) {
      return;
    }
    setStripeUiState("disconnecting");
    try {
      setStripeStatus(await disconnectStripeGateway());
      notify("Stripe disconnected.");
      setStripeUiState("idle");
    } catch (err) {
      setStripeUiState("error");
      notify(err instanceof ApiError ? err.message : "Unable to disconnect Stripe.", "error");
    }
  }

  const paypalConnected = Boolean(paypalStatus?.connected);
  const paypalBusy =
    paypalUiState === "connecting" || paypalUiState === "testing" || paypalUiState === "disconnecting";
  const paypalConnectedDate = paypalStatus?.connectedAt
    ? new Date(paypalStatus.connectedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const paypalEnvironmentLabel =
    paypalStatus?.environment === "production"
      ? "Live"
      : paypalStatus?.environment === "sandbox"
        ? "Sandbox"
        : null;

  const stripeConnected = Boolean(stripeStatus?.connected);
  const stripeBusy =
    stripeUiState === "connecting" || stripeUiState === "testing" || stripeUiState === "disconnecting";
  const stripeConnectedDate = stripeStatus?.connectedAt
    ? new Date(stripeStatus.connectedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const stripeEnvironmentLabel =
    stripeStatus?.environment === "live"
      ? "Live"
      : stripeStatus?.environment === "test"
        ? "Test"
        : null;
  const stripeAccountLabel =
    stripeStatus?.account ?? stripeStatus?.accountId ?? "Company Stripe account";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Gateways"
        description="Connect your company's payment provider so customers can pay invoices online."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087] text-xs font-bold text-white">
                P
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">PayPal</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {paypalConnected ? (
                    <span className="font-medium text-success">✓ Connected</span>
                  ) : paypalUiState === "connecting" ? (
                    <span>Connecting…</span>
                  ) : (
                    <span>● Not connected</span>
                  )}
                </p>
              </div>
            </div>
            {paypalConnected ? (
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success">
                ✓ Connected
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted">
            {paypalConnected
              ? "Invoice payments are processed with your company PayPal REST application. The connected login confirms the authorized Super Admin account."
              : "Accept customer invoice payments through your company's PayPal account. Connecting opens a PayPal login window — you never enter your PayPal password in InvoiceHub."}
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-muted">Loading…</p>
          ) : paypalConnected ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Account</dt>
                <dd className="font-medium text-foreground">
                  {paypalStatus?.account ?? "Company PayPal account"}
                </dd>
              </div>
              {paypalEnvironmentLabel ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Environment</dt>
                  <dd className="font-medium text-foreground">{paypalEnvironmentLabel}</dd>
                </div>
              ) : null}
              {paypalConnectedDate ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Connected</dt>
                  <dd className="font-medium text-foreground">{paypalConnectedDate}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {paypalUiState === "error" && !paypalConnected ? (
            <p className="mt-4 text-sm text-primary">
              PayPal connection failed.{" "}
              <button type="button" className="underline" onClick={() => void handlePayPalConnect()}>
                Try again
              </button>
            </p>
          ) : null}

          {!paypalConnected && paypalStatus && !paypalStatus.configured ? (
            <p className="mt-4 text-sm text-muted">
              Server PayPal credentials or Return URL are not fully configured. Set{" "}
              <code className="text-xs">PAYPAL_CLIENT_ID</code>,{" "}
              <code className="text-xs">PAYPAL_CLIENT_SECRET</code>,{" "}
              <code className="text-xs">PAYPAL_ENVIRONMENT</code>, and{" "}
              <code className="text-xs">PAYPAL_REDIRECT_URI</code>.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {paypalConnected ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={paypalBusy}
                  onClick={() => void handlePayPalTest()}
                >
                  {paypalUiState === "testing" ? "Testing…" : "Test Connection"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={paypalBusy}
                  onClick={() => void handlePayPalDisconnect()}
                >
                  {paypalUiState === "disconnecting" ? "Disconnecting…" : "Disconnect"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled={paypalBusy || (paypalStatus != null && !paypalStatus.configured)}
                onClick={() => void handlePayPalConnect()}
              >
                {paypalUiState === "connecting" ? "Waiting for PayPal…" : "Connect PayPal"}
              </Button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635BFF] text-xs font-bold text-white">
                S
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Stripe</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {stripeConnected ? (
                    <span className="font-medium text-success">✓ Connected</span>
                  ) : stripeUiState === "connecting" ? (
                    <span>Connecting…</span>
                  ) : (
                    <span>● Not connected</span>
                  )}
                </p>
              </div>
            </div>
            {stripeConnected ? (
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-medium text-success">
                ✓ Connected
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted">
            {stripeConnected
              ? "Invoice payments are processed through your connected Stripe account."
              : "Connect your Stripe account to receive invoice payments through the platform."}
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-muted">Loading…</p>
          ) : stripeConnected ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Account</dt>
                <dd className="font-medium text-foreground">{stripeAccountLabel}</dd>
              </div>
              {stripeEnvironmentLabel ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Environment</dt>
                  <dd className="font-medium text-foreground">{stripeEnvironmentLabel}</dd>
                </div>
              ) : null}
              {stripeConnectedDate ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Connected</dt>
                  <dd className="font-medium text-foreground">{stripeConnectedDate}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {stripeUiState === "error" && !stripeConnected ? (
            <p className="mt-4 text-sm text-primary">
              Stripe connection failed.{" "}
              <button type="button" className="underline" onClick={() => void handleStripeConnect()}>
                Try again
              </button>
            </p>
          ) : null}

          {!stripeConnected && stripeStatus && !stripeStatus.configured ? (
            <p className="mt-4 text-sm text-muted">
              Server Stripe credentials or Return URL are not fully configured. Set{" "}
              <code className="text-xs">STRIPE_CLIENT_ID</code>,{" "}
              <code className="text-xs">STRIPE_SECRET_KEY</code>, and{" "}
              <code className="text-xs">STRIPE_REDIRECT_URI</code>, then restart the API.
            </p>
          ) : null}

          {stripeStatus?.configured && !stripeStatus.webhookConfigured ? (
            <p className="mt-4 text-sm text-muted">
              Connect works without a webhook. Add{" "}
              <code className="text-xs">STRIPE_WEBHOOK_SECRET</code> later so invoice payments
              sync automatically from Stripe.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {stripeConnected ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={stripeBusy}
                  onClick={() => void handleStripeTest()}
                >
                  {stripeUiState === "testing" ? "Testing…" : "Test Connection"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={stripeBusy}
                  onClick={() => void handleStripeDisconnect()}
                >
                  {stripeUiState === "disconnecting" ? "Disconnecting…" : "Disconnect"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled={stripeBusy || (stripeStatus != null && !stripeStatus.configured)}
                onClick={() => void handleStripeConnect()}
              >
                {stripeUiState === "connecting" ? "Waiting for Stripe…" : "Connect Stripe"}
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

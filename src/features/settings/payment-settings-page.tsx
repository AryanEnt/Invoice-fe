"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
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

/** Full browser tab (no popup features) — used for Stripe Connect only. */
function openFullTab(name: string): Window | null {
  return window.open("about:blank", name);
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
  const [stripeTestHint, setStripeTestHint] = useState<"success" | "error" | null>(null);
  const [paypalTestHint, setPaypalTestHint] = useState<"success" | "error" | null>(null);
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
    setPaypalTestHint(null);
    setPaypalUiState("testing");
    try {
      const result = await testPayPalGateway();
      if (!result.connected) {
        setPaypalUiState("error");
        setPaypalTestHint("error");
        notify(
          result.message ??
            "PayPal connection failed. Please verify the PayPal application and reconnect.",
          "error",
        );
        return;
      }
      setPaypalTestHint("success");
      notify("PayPal connection verified.");
      await load();
      setPaypalUiState("idle");
    } catch (err) {
      setPaypalUiState("error");
      setPaypalTestHint("error");
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
    setPaypalTestHint(null);
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
    const tab = openFullTab("stripe-connect");
    if (!tab) {
      setStripeUiState("error");
      notify("Tab blocked. Allow pop-ups/tabs for InvoiceHub and try again.", "error");
      return;
    }

    stripePopupRef.current = tab;
    setStripeUiState("connecting");
    try {
      tab.document.write(
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
      if (tab.closed) {
        setStripeUiState("idle");
        clearStripePopupWatch();
        return;
      }
      tab.location.href = result.url;

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
        tab.close();
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
    setStripeTestHint(null);
    setStripeUiState("testing");
    try {
      const result = await testStripeGateway();
      if (!result.connected) {
        setStripeUiState("error");
        setStripeTestHint("error");
        notify(
          result.message ??
            "Stripe connection failed. Please verify the Stripe application and reconnect.",
          "error",
        );
        return;
      }
      setStripeTestHint("success");
      notify("Stripe connection verified.");
      await load();
      setStripeUiState("idle");
    } catch (err) {
      setStripeUiState("error");
      setStripeTestHint("error");
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
    setStripeTestHint(null);
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

  const connectedCount = Number(stripeConnected) + Number(paypalConnected);

  return (
    <div className="mx-auto max-w-[1180px] space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold leading-8 tracking-tight text-foreground">
            Payment gateways
          </h1>
          <p className="mt-1.5 max-w-xl text-[14px] leading-5 text-muted">
            Configure how customers pay invoices online.
          </p>
        </div>
        {!loading ? (
          <p className="shrink-0 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connectedCount > 0 ? "bg-success" : "bg-muted"
                }`}
                aria-hidden
              />
              <span className="font-medium text-foreground">{connectedCount}</span>
              connected
            </span>
          </p>
        ) : null}
      </header>

      <section className="border-y border-border py-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-foreground">Payment methods</h2>
          <p className="text-[13px] text-muted">
            {loading ? "Checking…" : `${connectedCount} of 2 connected`}
          </p>
        </div>
        <ul className="mt-3 divide-y divide-border">
          <SummaryRow
            name="Stripe"
            status={
              loading
                ? "Loading"
                : stripeUiState === "connecting"
                  ? "Connecting"
                  : stripeConnected
                    ? "Connected"
                    : "Not connected"
            }
            connected={stripeConnected}
            pending={stripeUiState === "connecting"}
            loading={loading}
          />
          <SummaryRow
            name="PayPal"
            status={
              loading
                ? "Loading"
                : paypalUiState === "connecting"
                  ? "Connecting"
                  : paypalConnected
                    ? "Connected"
                    : "Not connected"
            }
            connected={paypalConnected}
            pending={paypalUiState === "connecting"}
            loading={loading}
          />
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <GatewayCard
          brand="stripe"
          title="Stripe"
          description="Card payments and Checkout"
          connected={stripeConnected}
          connecting={stripeUiState === "connecting"}
          loading={loading}
          environment={stripeEnvironmentLabel}
          details={
            stripeConnected
              ? [
                  { label: "Account", value: stripeAccountLabel },
                  ...(stripeEnvironmentLabel
                    ? [{ label: "Environment", value: stripeEnvironmentLabel }]
                    : []),
                  ...(stripeConnectedDate
                    ? [{ label: "Connected", value: stripeConnectedDate }]
                    : []),
                ]
              : []
          }
          alert={
            stripeUiState === "error" && !stripeConnected ? (
              <p className="text-[13px] text-danger">
                Stripe connection failed.{" "}
                <button
                  type="button"
                  className="font-medium underline underline-offset-2"
                  onClick={() => void handleStripeConnect()}
                >
                  Try again
                </button>
              </p>
            ) : !stripeConnected && stripeStatus && !stripeStatus.configured ? (
              <p className="text-[13px] text-muted">
                Configure <code className="text-[12px]">STRIPE_CLIENT_ID</code>,{" "}
                <code className="text-[12px]">STRIPE_SECRET_KEY</code>, and{" "}
                <code className="text-[12px]">STRIPE_REDIRECT_URI</code>, then restart the API.
              </p>
            ) : stripeStatus?.configured && !stripeStatus.webhookConfigured ? (
              <p className="text-[13px] text-muted">
                Connect works without a webhook. Add{" "}
                <code className="text-[12px]">STRIPE_WEBHOOK_SECRET</code> later so payments sync
                automatically.
              </p>
            ) : null
          }
          testHint={stripeTestHint}
          actions={
            stripeConnected ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 px-3 text-[13px]"
                  disabled={stripeBusy}
                  onClick={() => void handleStripeTest()}
                >
                  {stripeUiState === "testing" ? "Testing…" : "Test connection"}
                </Button>
                <button
                  type="button"
                  disabled={stripeBusy}
                  className="h-8 px-2 text-[13px] font-medium text-muted transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void handleStripeDisconnect()}
                >
                  {stripeUiState === "disconnecting" ? "Disconnecting…" : "Disconnect"}
                </button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-[13px]"
                disabled={stripeBusy || (stripeStatus != null && !stripeStatus.configured)}
                onClick={() => void handleStripeConnect()}
              >
                {stripeUiState === "connecting" ? "Waiting for Stripe…" : "Connect Stripe"}
              </Button>
            )
          }
        />

        <GatewayCard
          brand="paypal"
          title="PayPal"
          description="Wallet and checkout"
          connected={paypalConnected}
          connecting={paypalUiState === "connecting"}
          loading={loading}
          environment={paypalEnvironmentLabel}
          details={
            paypalConnected
              ? [
                  {
                    label: "Account",
                    value: paypalStatus?.account ?? "Company PayPal account",
                  },
                  ...(paypalEnvironmentLabel
                    ? [{ label: "Environment", value: paypalEnvironmentLabel }]
                    : []),
                  ...(paypalConnectedDate
                    ? [{ label: "Connected", value: paypalConnectedDate }]
                    : []),
                ]
              : []
          }
          alert={
            paypalUiState === "error" && !paypalConnected ? (
              <p className="text-[13px] text-danger">
                PayPal connection failed.{" "}
                <button
                  type="button"
                  className="font-medium underline underline-offset-2"
                  onClick={() => void handlePayPalConnect()}
                >
                  Try again
                </button>
              </p>
            ) : !paypalConnected && paypalStatus && !paypalStatus.configured ? (
              <p className="text-[13px] text-muted">
                Configure <code className="text-[12px]">PAYPAL_CLIENT_ID</code>,{" "}
                <code className="text-[12px]">PAYPAL_CLIENT_SECRET</code>,{" "}
                <code className="text-[12px]">PAYPAL_ENVIRONMENT</code>, and{" "}
                <code className="text-[12px]">PAYPAL_REDIRECT_URI</code>.
              </p>
            ) : null
          }
          testHint={paypalTestHint}
          actions={
            paypalConnected ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 px-3 text-[13px]"
                  disabled={paypalBusy}
                  onClick={() => void handlePayPalTest()}
                >
                  {paypalUiState === "testing" ? "Testing…" : "Test connection"}
                </Button>
                <button
                  type="button"
                  disabled={paypalBusy}
                  className="h-8 px-2 text-[13px] font-medium text-muted transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void handlePayPalDisconnect()}
                >
                  {paypalUiState === "disconnecting" ? "Disconnecting…" : "Disconnect"}
                </button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-[13px]"
                disabled={paypalBusy || (paypalStatus != null && !paypalStatus.configured)}
                onClick={() => void handlePayPalConnect()}
              >
                {paypalUiState === "connecting" ? "Waiting for PayPal…" : "Connect PayPal"}
              </Button>
            )
          }
        />
      </div>
    </div>
  );
}

function SummaryRow({
  name,
  status,
  connected,
  pending,
  loading,
}: {
  name: string;
  status: string;
  connected: boolean;
  pending: boolean;
  loading: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="font-medium text-foreground">{name}</span>
      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            loading
              ? "bg-muted"
              : connected
                ? "bg-success"
                : pending
                  ? "bg-warning"
                  : "bg-muted"
          }`}
          aria-hidden
        />
        <span className={connected && !loading ? "text-success" : undefined}>{status}</span>
      </span>
    </li>
  );
}

function GatewayCard({
  brand,
  title,
  description,
  connected,
  connecting,
  loading,
  environment,
  details,
  alert,
  testHint,
  actions,
}: {
  brand: "stripe" | "paypal";
  title: string;
  description: string;
  connected: boolean;
  connecting: boolean;
  loading: boolean;
  environment: string | null;
  details: Array<{ label: string; value: string }>;
  alert: ReactNode;
  testHint: "success" | "error" | null;
  actions: ReactNode;
}) {
  const isStripe = brand === "stripe";

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-surface p-6 transition-[border-color,box-shadow] duration-150 hover:border-foreground/15 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] ${
              isStripe ? "bg-[#0a2540] text-white" : "bg-[#003087] text-white"
            }`}
            aria-hidden
          >
            {isStripe ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.454 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.14 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.546-2.354 1.546-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.597-3.146 5.187-6.988 5.187h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.152a.805.805 0 0 1-.794.68H7.72a.483.483 0 0 1-.477-.558L9.462 6.21a.96.96 0 0 1 .95-.812h5.286c1.354 0 2.428.28 3.214.86.7.514 1.122 1.247 1.155 2.22zM7.154 21.53l.8-5.07v.002c.06-.377.38-.652.76-.652h1.027c3.392 0 5.98-1.378 6.74-5.36.08-.41.12-.78.12-1.11-.54.34-1.24.55-2.12.55H9.38a.96.96 0 0 0-.948.81L7.154 21.53z" />
              </svg>
            )}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {loading ? (
            <span className="text-[13px] text-muted">Loading…</span>
          ) : connected ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              Connected
            </span>
          ) : connecting ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
              Connecting…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden />
              Not connected
            </span>
          )}
          {connected && environment ? (
            <span className="rounded-md border border-border bg-muted-soft/70 px-1.5 py-0.5 text-[11px] font-medium text-muted">
              {environment}
            </span>
          ) : null}
        </div>
      </div>

      {details.length > 0 ? (
        <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2">
          {details.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[13px] text-muted">{row.label}</dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : !loading && !connected ? (
        <p className="mt-5 border-t border-border pt-4 text-sm text-muted">
          {isStripe
            ? "Connect your Stripe account to accept card payments on public invoices."
            : "Connect PayPal to accept wallet checkout on invoices."}
        </p>
      ) : null}

      {alert ? <div className="mt-4">{alert}</div> : null}

      {testHint ? (
        <p
          className={`mt-3 text-[13px] font-medium ${
            testHint === "success" ? "text-success" : "text-danger"
          }`}
        >
          {testHint === "success" ? "Connection successful" : "Connection failed"}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-1 border-t border-border pt-4">
        {actions}
      </div>
    </section>
  );
}

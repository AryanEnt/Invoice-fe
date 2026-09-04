"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/env";

/**
 * PayPal Return URL lands here (localhost FE), then we forward to the API callback
 * with the same query string so token exchange keeps redirect_uri identical.
 * Avoids free-ngrok interstitial breaking the OAuth return.
 */
export default function PayPalOAuthCallbackPage() {
  const [message, setMessage] = useState("Finishing PayPal connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("code") && !params.get("error")) {
      setMessage("Missing PayPal authorization response. Return to Payment Gateways and try again.");
      return;
    }

    const target = new URL(`${getApiBaseUrl()}/api/settings/payment/paypal/callback`);
    params.forEach((value, key) => {
      target.searchParams.set(key, value);
    });
    window.location.replace(target.toString());
  }, []);

  return <p className="p-6 text-sm text-muted">{message}</p>;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTurnstileSiteKey } from "@/lib/env";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string;
      execute: (widgetId: string) => Promise<string>;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      ready: (callback: () => void) => void;
    };
  }
}

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  tabindex?: number;
  "retry-auto"?: boolean;
  "retry-interval"?: number;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  callback?: (token: string) => void;
  "before-interactive-callback"?: () => void;
  "after-interactive-callback"?: () => void;
  "unsupported-callback"?: () => void;
  appearance?: "always" | "execute" | "interaction-only";
  "refresh-expired"?: boolean;
  "timeout-callback"?: () => void;
}

// Module-level state to prevent duplicate script loads
let scriptLoadPromise: Promise<void> | null = null;
let isScriptLoaded = false;
let isScriptLoading = false;

function loadTurnstileScript(): Promise<void> {
  if (isScriptLoaded || window.turnstile) {
    isScriptLoaded = true;
    return Promise.resolve();
  }

  if (isScriptLoading && scriptLoadPromise) {
    return scriptLoadPromise;
  }

  isScriptLoading = true;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      isScriptLoading = false;
      scriptLoadPromise = null;
      reject(new Error("Failed to load Turnstile script"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// Check if we're in a development environment without proper Turnstile config
// Test key (1x...) should work on localhost with a testing banner
function isLocalDevWithoutTurnstile(): boolean {
  if (typeof window === "undefined") return false;
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const siteKey = getTurnstileSiteKey();
  // Only use mock mode if NO site key is configured
  const hasNoKey = !siteKey || siteKey.trim() === "";
  return isLocalhost && hasNoKey;
}

export function useTurnstile() {
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string | null>(null);
  const resolveRef = useRef<((token: string) => void) | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const siteKey = getTurnstileSiteKey();
  const isMountedRef = useRef(true);
  const useMockMode = isLocalDevWithoutTurnstile();

  // In mock mode (localhost with test key), simulate loaded state immediately
  useEffect(() => {
    if (useMockMode) {
      setLoaded(true);
      return;
    }

    if (!siteKey) return;

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (!cancelled && isMountedRef.current) {
          setLoaded(true);
        }
      })
      .catch((err) => {
        if (!cancelled && isMountedRef.current) {
          setError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [siteKey, useMockMode]);

  const renderWidget = useCallback(() => {
    if (useMockMode) {
      // In mock mode, create a fake widget ID
      setWidgetId("mock-widget-id");
      return;
    }

    if (!loaded || !siteKey || widgetId || !containerRef.current) return;

    const container = document.createElement("div");
    container.setAttribute("aria-hidden", "true");
    widgetContainerRef.current = container;
    containerRef.current.appendChild(container);

    const newWidgetId = window.turnstile!.render(container, {
      sitekey: siteKey,
      theme: "auto",
      size: "normal",
      appearance: "always",
      callback: (token: string) => {
        tokenRef.current = token;
        if (resolveRef.current) {
          resolveRef.current(token);
          resolveRef.current = null;
        }
      },
      "expired-callback": () => {
        tokenRef.current = null;
      },
      "error-callback": () => {
        tokenRef.current = null;
        setError("Turnstile verification failed. Please try again.");
      },
    });

    setWidgetId(newWidgetId);
  }, [loaded, siteKey, widgetId, useMockMode]);

  const removeWidget = useCallback(() => {
    if (useMockMode) {
      setWidgetId(null);
      return;
    }

    if (widgetId && window.turnstile && widgetContainerRef.current) {
      window.turnstile.remove(widgetId);
      widgetContainerRef.current.remove();
      widgetContainerRef.current = null;
      setWidgetId(null);
      tokenRef.current = null;
    }
  }, [widgetId, useMockMode]);

  // Render widget when loaded and siteKey available
  useEffect(() => {
    renderWidget();
    return () => {
      removeWidget();
    };
  }, [renderWidget, removeWidget]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      removeWidget();
    };
  }, [removeWidget]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (useMockMode) {
      // Return a mock token for local development
      return "mock-turnstile-token";
    }

    if (!siteKey) return null;
    if (!widgetId || !window.turnstile) return tokenRef.current;

    if (tokenRef.current) {
      return tokenRef.current;
    }

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      window.turnstile!.execute(widgetId);
    });
  }, [siteKey, widgetId, useMockMode]);

  const reset = useCallback(() => {
    if (useMockMode) {
      tokenRef.current = null;
      return;
    }

    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
      tokenRef.current = null;
    }
  }, [widgetId, useMockMode]);

  return {
    containerRef,
    getToken,
    reset,
    loaded,
    error,
    widgetId,
  };
}
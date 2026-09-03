"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/types";
import { getHealth } from "@/services/health.service";
import type { HealthData } from "@/types/api";

interface HealthState {
  status: "loading" | "success" | "error";
  data: HealthData | null;
  error: string | null;
}

export function useHealth(): HealthState {
  const [state, setState] = useState<HealthState>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "success", data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : "Unable to reach the API. Confirm the backend is running.";

        setState({ status: "error", data: null, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

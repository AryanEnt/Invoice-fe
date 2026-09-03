"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "@/providers/auth-provider";
import type { OrganizationSummary } from "@/types/admin";

interface WorkspaceContextValue {
  organizationId: string | null;
  organizations: OrganizationSummary[];
  loading: boolean;
  error: string | null;
  generation: number;
  scopeLabel: string;
  organizationName: string | null;
  refresh: () => Promise<void>;
  tenantListsReady: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const organizationId = user?.organizationId ?? null;
  const organizationName = user?.role === "SUPER_ADMIN" ? "Company" : "Office";
  const scopeLabel =
    user?.role === "SUPER_ADMIN"
      ? "Company"
      : user?.role === "ADMIN"
        ? "My members"
        : "My work";

  const refresh = useCallback(async () => {
    return;
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      organizationId,
      organizations: [],
      loading: false,
      error: null,
      generation: 0,
      scopeLabel,
      organizationName,
      refresh,
      tenantListsReady: true,
    }),
    [organizationId, organizationName, refresh, scopeLabel],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}

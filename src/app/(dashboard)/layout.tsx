"use client";

import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AdminGuard } from "@/components/layout/admin-guard";
import { SuperAdminGuard } from "@/components/layout/super-admin-guard";
import { useRequireAuth } from "@/providers/auth-provider";
import { WorkspaceProvider } from "@/providers/workspace-provider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { loading, user } = useRequireAuth();

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
        Loading…
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
          Loading…
        </div>
      }
    >
      <WorkspaceProvider>
        <SuperAdminGuard>
          <AdminGuard>
            <AppShell>{children}</AppShell>
          </AdminGuard>
        </SuperAdminGuard>
      </WorkspaceProvider>
    </Suspense>
  );
}

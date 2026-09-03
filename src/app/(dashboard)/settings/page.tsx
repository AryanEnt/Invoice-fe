"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SettingsPage } from "@/features/settings/settings-page";
import { useAuth } from "@/providers/auth-provider";

export default function SettingsRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === "SUPER_ADMIN") {
      router.replace("/settings/invoice");
    }
  }, [loading, router, user?.role]);

  if (loading || user?.role === "SUPER_ADMIN") {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  return <SettingsPage />;
}

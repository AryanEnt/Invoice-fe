"use client";

import { useState } from "react";
import { AdministratorsPage } from "@/features/administrators/administrators-page";
import { MembersPage } from "@/features/members/members-page";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/providers/auth-provider";

type TabId = "admins" | "members";

export function UsersPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("admins");

  if (loading || user?.role !== "SUPER_ADMIN") {
    return <p className="text-sm text-muted">Checking access…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admins & Users"
        description="Directory for team administrators and members. Users are not duplicated when they belong to multiple teams."
      />
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          type="button"
          className={
            tab === "admins"
              ? "rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary"
              : "rounded-full px-3 py-1 text-sm text-muted hover:bg-muted-soft"
          }
          onClick={() => setTab("admins")}
        >
          Team admins
        </button>
        <button
          type="button"
          className={
            tab === "members"
              ? "rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary"
              : "rounded-full px-3 py-1 text-sm text-muted hover:bg-muted-soft"
          }
          onClick={() => setTab("members")}
        >
          Members
        </button>
      </div>
      {tab === "admins" ? <AdministratorsPage embedded /> : <MembersPage embedded />}
    </div>
  );
}

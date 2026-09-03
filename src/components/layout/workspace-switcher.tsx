"use client";

import { useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types/auth";

const HEADER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export function WorkspaceSwitcher() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="hidden min-w-0 sm:block">
      <p className="truncate text-xs text-muted">Role</p>
      <p className="truncate text-sm font-medium text-foreground">
        {HEADER_ROLE_LABELS[user.role as UserRole]}
      </p>
    </div>
  );
}

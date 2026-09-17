"use client";

import { useAuth } from "@/providers/auth-provider";

function formatLastLogin(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function WorkspaceSwitcher() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const lastLogin = formatLastLogin(user.lastLoginAt);

  return (
    <div className="hidden min-w-0 sm:block">
      <p className="truncate text-sm font-semibold text-foreground">Welcome, {fullName}</p>
      {lastLogin ? (
        <p className="mt-0.5 truncate text-xs text-muted">Last logged in {lastLogin}</p>
      ) : (
        <p className="mt-0.5 truncate text-xs text-muted">Last logged in —</p>
      )}
    </div>
  );
}

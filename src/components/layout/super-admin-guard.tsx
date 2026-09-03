"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isSuperAdminPath } from "@/config/navigation";
import { useAuth } from "@/providers/auth-provider";

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN" && !isSuperAdminPath(pathname)) {
      router.replace("/");
    }
  }, [pathname, router, user?.role]);

  return children;
}

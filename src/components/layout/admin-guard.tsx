"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isAdminPath } from "@/config/navigation";
import { useAuth } from "@/providers/auth-provider";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "ADMIN" && !isAdminPath(pathname)) {
      router.replace("/");
    }
  }, [pathname, router, user?.role]);

  return children;
}

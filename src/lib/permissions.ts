import type { PublicUser } from "@/types/auth";

export function hasPermission(user: PublicUser | null | undefined, permission: string): boolean {
  return Boolean(user?.permissions.includes(permission));
}

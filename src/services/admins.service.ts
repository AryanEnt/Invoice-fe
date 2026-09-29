import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import { clampPageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/pagination";
import { adminListResultSchema, adminUserSchema } from "@/schemas/admin";
import { credentialUserSchema } from "@/schemas/member";
import type { AdminFormValues, AdminListQuery, AdminListResult, AdminUser } from "@/types/admin";
import type { CredentialUser } from "@/types/member";
import type { AccountStatus } from "@/types/auth";

function toQueryString(query: AdminListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(clampPageSize(query.pageSize, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE)));
  return params.toString();
}

export async function listAdmins(query: AdminListQuery): Promise<AdminListResult> {
  const data = await apiRequest<AdminListResult>(`/api/admins?${toQueryString(query)}`);
  return adminListResultSchema.parse(data);
}

export async function getAdmin(id: string): Promise<AdminUser> {
  const data = await apiRequest<{ user: AdminUser }>(`/api/admins/${id}`);
  return adminUserSchema.parse(data.user);
}

/** The temporary password is returned once; callers must keep it in component state only. */
export async function createAdmin(values: AdminFormValues): Promise<{
  user: AdminUser;
  temporaryPassword: string;
}> {
  const data = await apiRequest<{ user: AdminUser; temporaryPassword: string }>("/api/admins", {
    method: "POST",
    body: JSON.stringify({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      status: values.status,
    }),
  });

  return {
    user: adminUserSchema.parse(data.user),
    temporaryPassword: z.string().min(1).parse(data.temporaryPassword),
  };
}

export async function updateAdmin(
  id: string,
  values: Pick<AdminFormValues, "firstName" | "lastName" | "email" | "phone" | "organizationId">,
): Promise<AdminUser> {
  const data = await apiRequest<{ user: AdminUser }>(`/api/admins/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
    }),
  });

  return adminUserSchema.parse(data.user);
}

export async function updateAdminStatus(id: string, status: AccountStatus): Promise<AdminUser> {
  const data = await apiRequest<{ user: AdminUser }>(`/api/admins/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return adminUserSchema.parse(data.user);
}

/** Sets a Super Admin–chosen password. The server never echoes it back. */
export async function setAdminPassword(id: string, newPassword: string): Promise<CredentialUser> {
  const data = await apiRequest<{ user: CredentialUser }>(`/api/admins/${id}/password`, {
    method: "PUT",
    body: JSON.stringify({ newPassword }),
  });
  return credentialUserSchema.parse(data.user);
}

/** The temporary password is returned once; callers must keep it in component state only. */
export async function resetAdminPassword(
  id: string,
): Promise<{ user: CredentialUser; temporaryPassword: string }> {
  const data = await apiRequest<{ user: CredentialUser; temporaryPassword: string }>(
    `/api/admins/${id}/password`,
    { method: "POST" },
  );

  return {
    user: credentialUserSchema.parse(data.user),
    temporaryPassword: z.string().min(1).parse(data.temporaryPassword),
  };
}

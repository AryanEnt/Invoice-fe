import { apiRequest } from "@/lib/api/client";
import { adminListResultSchema, adminUserSchema } from "@/schemas/admin";
import type { AdminFormValues, AdminListQuery, AdminListResult, AdminUser } from "@/types/admin";
import type { AccountStatus } from "@/types/auth";

function toQueryString(query: AdminListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));
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

export async function createAdmin(values: AdminFormValues): Promise<{
  user: AdminUser;
  temporaryPassword: string | null;
  invitationToken: string;
}> {
  const data = await apiRequest<{
    user: AdminUser;
    temporaryPassword: string | null;
    invitationToken: string;
  }>("/api/admins", {
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
    temporaryPassword: data.temporaryPassword,
    invitationToken: data.invitationToken,
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

export async function resetAdminPassword(id: string): Promise<{ temporaryPassword: string }> {
  const data = await apiRequest<{ temporaryPassword: string }>(`/api/admins/${id}/password`, {
    method: "POST",
  });

  return data;
}

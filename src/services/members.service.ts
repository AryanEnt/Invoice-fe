import { z } from "zod";
import { apiRequest } from "@/lib/api/client";
import { administratorSummarySchema, memberListResultSchema, memberUserSchema } from "@/schemas/member";
import type { AdministratorSummary, MemberFormValues, MemberListResult, MemberUser } from "@/types/member";
import type { AccountStatus } from "@/types/auth";

export async function listMemberAdministrators(): Promise<{
  items: AdministratorSummary[];
  unassignedCount: number;
}> {
  const data = await apiRequest<{ items: AdministratorSummary[]; unassignedCount: number }>(
    "/api/members/administrators",
  );
  return {
    items: z.array(administratorSummarySchema).parse(data.items),
    unassignedCount: data.unassignedCount,
  };
}

const MEMBER_LIST_MAX_PAGE_SIZE = 50;

export async function listMembers(query: {
  search?: string;
  status?: AccountStatus | "";
  organizationId?: string;
  administratorId?: string | "none";
  page?: number;
  pageSize?: number;
}): Promise<MemberListResult> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  if (query.administratorId) params.set("administratorId", query.administratorId);
  params.set("page", String(query.page ?? 1));
  params.set(
    "pageSize",
    String(Math.min(query.pageSize ?? 10, MEMBER_LIST_MAX_PAGE_SIZE)),
  );
  return memberListResultSchema.parse(await apiRequest<MemberListResult>(`/api/members?${params}`));
}

export async function listAllMembers(
  query: Omit<Parameters<typeof listMembers>[0], "page" | "pageSize">,
): Promise<MemberUser[]> {
  const pageSize = MEMBER_LIST_MAX_PAGE_SIZE;
  const first = await listMembers({ ...query, page: 1, pageSize });
  if (first.totalPages <= 1) {
    return first.items;
  }

  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) =>
      listMembers({ ...query, page: index + 2, pageSize }),
    ),
  );

  return [...first.items, ...rest.flatMap((page) => page.items)];
}

export async function getMember(id: string): Promise<MemberUser> {
  const data = await apiRequest<{ user: MemberUser }>(`/api/members/${id}`);
  return memberUserSchema.parse(data.user);
}

export async function createMember(values: MemberFormValues): Promise<{
  user: MemberUser;
  temporaryPassword: string | null;
}> {
  const data = await apiRequest<{ user: MemberUser; temporaryPassword: string | null }>(
    "/api/members",
    {
      method: "POST",
      body: JSON.stringify({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        organizationId: values.organizationId || undefined,
        temporaryPassword: values.temporaryPassword || undefined,
        status: values.status,
      }),
    },
  );

  return {
    user: memberUserSchema.parse(data.user),
    temporaryPassword: data.temporaryPassword,
  };
}

export async function updateMember(
  id: string,
  values: Pick<MemberFormValues, "firstName" | "lastName" | "email" | "temporaryPassword">,
): Promise<{ user: MemberUser; temporaryPassword: string | null }> {
  const data = await apiRequest<{ user: MemberUser; temporaryPassword: string | null }>(
    `/api/members/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        temporaryPassword: values.temporaryPassword || undefined,
      }),
    },
  );
  return {
    user: memberUserSchema.parse(data.user),
    temporaryPassword: data.temporaryPassword,
  };
}

export async function resetMemberPassword(id: string): Promise<{ temporaryPassword: string }> {
  const data = await apiRequest<{ temporaryPassword: string }>(`/api/members/${id}/password`, {
    method: "POST",
  });
  return { temporaryPassword: data.temporaryPassword };
}

export async function updateMemberStatus(id: string, status: AccountStatus): Promise<MemberUser> {
  const data = await apiRequest<{ user: MemberUser }>(`/api/members/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return memberUserSchema.parse(data.user);
}

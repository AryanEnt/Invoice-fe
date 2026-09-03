import type { OrganizationSummary } from "@/types/admin";
import type { AccountStatus, PublicUser } from "@/types/auth";

export interface AdministratorSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface MemberUser extends PublicUser {
  organization: OrganizationSummary | null;
  administrator: AdministratorSummary | null;
}

export interface MemberListResult {
  items: MemberUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MemberFormValues {
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  temporaryPassword: string;
  status: AccountStatus;
}

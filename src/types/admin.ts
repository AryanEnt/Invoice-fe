import type { AccountStatus, PublicUser } from "@/types/auth";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  logoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  adminCount?: number;
  memberCount?: number;
  customerCount?: number;
  invoiceCount?: number;
}

export interface AdminUser extends PublicUser {
  organization: OrganizationSummary | null;
  memberCount: number;
}

export interface AdminListResult {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminListQuery {
  search?: string;
  status?: AccountStatus | "";
  organizationId?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organizationId: string;
  temporaryPassword: string;
  status: AccountStatus;
}

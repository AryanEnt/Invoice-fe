export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MEMBER";
export type AccountStatus = "ACTIVE" | "INACTIVE";

export interface AdministratorSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: AccountStatus;
  organizationId: string | null;
  permissions: string[];
  administrator: AdministratorSummary | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

import type { UserRole } from "@/types/auth";

export type NavIcon =
  | "home"
  | "invoice"
  | "customer"
  | "product"
  | "payment"
  | "expense"
  | "report"
  | "member"
  | "admin"
  | "settings";

export interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
  icon: NavIcon;
  permission?: string;
  match?: "exact" | "prefix" | "reports" | "expenses" | "revenue";
}

export interface NavGroup {
  id: string;
  label: string | null;
  collapsible?: boolean;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "company",
    label: null,
    items: [
      { href: "/", label: "Dashboard", roles: ["SUPER_ADMIN"], match: "exact", icon: "home" },
      { href: "/administrators", label: "Administrators", roles: ["SUPER_ADMIN"], match: "prefix", icon: "admin", permission: "ADMINS_VIEW" },
      { href: "/members", label: "Members", roles: ["SUPER_ADMIN"], match: "prefix", icon: "member", permission: "USERS_VIEW" },
      { href: "/invoices", label: "Invoices", roles: ["SUPER_ADMIN"], match: "prefix", icon: "invoice", permission: "INVOICES_VIEW" },
      { href: "/reports", label: "Reports", roles: ["SUPER_ADMIN"], match: "reports", icon: "report", permission: "REPORTS_VIEW" },
    ],
  },
  {
    id: "sa-settings",
    label: "Settings",
    collapsible: true,
    items: [
      { href: "/settings/invoice", label: "Invoice Settings", roles: ["SUPER_ADMIN"], match: "prefix", icon: "invoice", permission: "SETTINGS_VIEW" },
      { href: "/settings/templates", label: "Templates", roles: ["SUPER_ADMIN"], match: "prefix", icon: "settings", permission: "SETTINGS_VIEW" },
      { href: "/settings/account", label: "Account", roles: ["SUPER_ADMIN"], match: "prefix", icon: "admin", permission: "SETTINGS_VIEW" },
      { href: "/settings/payment", label: "Payment", roles: ["SUPER_ADMIN"], match: "prefix", icon: "payment", permission: "SETTINGS_VIEW" },
    ],
  },
  {
    id: "admin-work",
    label: null,
    items: [
      { href: "/", label: "Dashboard", roles: ["ADMIN"], match: "exact", icon: "home" },
      { href: "/members", label: "Members", roles: ["ADMIN"], match: "prefix", icon: "member", permission: "USERS_VIEW" },
      { href: "/invoices", label: "Invoices", roles: ["ADMIN"], match: "prefix", icon: "invoice", permission: "INVOICES_VIEW" },
      { href: "/reports", label: "Reports", roles: ["ADMIN"], match: "reports", icon: "report", permission: "REPORTS_VIEW" },
      { href: "/settings", label: "Settings", roles: ["ADMIN"], match: "prefix", icon: "settings" },
    ],
  },
  {
    id: "member-work",
    label: null,
    items: [
      { href: "/", label: "Dashboard", roles: ["MEMBER"], match: "exact", icon: "home" },
      { href: "/customers", label: "Customers", roles: ["MEMBER"], match: "prefix", icon: "customer", permission: "CUSTOMERS_VIEW" },
      { href: "/invoices", label: "Invoices", roles: ["MEMBER"], match: "prefix", icon: "invoice", permission: "INVOICES_VIEW" },
      { href: "/payments", label: "Payments", roles: ["MEMBER"], match: "prefix", icon: "payment", permission: "PAYMENTS_VIEW" },
      { href: "/reports", label: "Reports", roles: ["MEMBER"], match: "reports", icon: "report", permission: "REPORTS_VIEW" },
      { href: "/settings", label: "Settings", roles: ["MEMBER"], match: "prefix", icon: "settings" },
    ],
  },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  MEMBER: "Member",
};

export const SUPER_ADMIN_PATH_PREFIXES = [
  "/",
  "/members",
  "/administrators",
  "/invoices",
  "/reports",
  "/settings",
];

export const ADMIN_PATH_PREFIXES = ["/", "/members", "/invoices", "/reports", "/settings"];

export function isAdminPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return ADMIN_PATH_PREFIXES.some(
    (prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
}

export function isSuperAdminPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return SUPER_ADMIN_PATH_PREFIXES.some(
    (prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
}

export function isNavItemActive(item: NavItem, pathname: string, search: string): boolean {
  const kind = new URLSearchParams(search).get("kind");
  if (item.match === "exact") {
    return pathname === item.href;
  }
  if (item.match === "expenses") {
    return pathname === "/reports" && kind === "expenses";
  }
  if (item.match === "revenue") {
    return pathname === "/reports" && kind === "revenue";
  }
  if (item.match === "reports") {
    return pathname === "/reports";
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function pageTitleForPath(pathname: string, search: string): string {
  if (pathname === "/invoices/new") {
    return "Create invoice";
  }
  if (pathname.startsWith("/invoices/") && pathname.endsWith("/edit")) {
    return "Edit invoice";
  }
  if (pathname.startsWith("/invoices/") && pathname !== "/invoices") {
    return "Invoice";
  }
  if (pathname.startsWith("/customers/") && pathname !== "/customers") {
    return "Customer";
  }
  if (pathname.startsWith("/members/") && pathname !== "/members") {
    return "Member";
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.href.startsWith("/settings") && isNavItemActive(item, pathname, search)) {
          return item.label;
        }
      }
    }
    return "Settings";
  }

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (isNavItemActive(item, pathname, search)) {
        return item.label;
      }
    }
  }

  return "Invoice Hub";
}

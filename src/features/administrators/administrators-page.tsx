"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionGroup, EditAction, StatusAction } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AdministratorForm,
  valuesFromAdmin,
} from "@/features/administrators/administrator-form";
import { MemberPasswordCell } from "@/features/members/member-password-cell";
import { ApiError } from "@/lib/api/types";
import {
  getCachedAdminPasswords,
  setCachedAdminPassword,
} from "@/lib/admin-password-cache";
import { copyText } from "@/lib/copy-text";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import {
  createAdmin,
  listAdmins,
  resetAdminPassword,
  updateAdmin,
  updateAdminStatus,
} from "@/services/admins.service";
import type { AdminFormValues, AdminListResult, AdminUser } from "@/types/admin";
import type { AccountStatus } from "@/types/auth";

export function AdministratorsPage({ embedded = false }: { embedded?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();

  const [result, setResult] = useState<AdminListResult | null>(null);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [copyBusyId, setCopyBusyId] = useState<string | null>(null);

  useEffect(() => {
    setPasswords(getCachedAdminPasswords());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const admins = await listAdmins({
        search: search || undefined,
        status,
        page,
        pageSize: 10,
      });
      setResult(admins);
      setPasswords((current) => ({ ...current, ...getCachedAdminPasswords() }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load administrators.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    if (!authLoading && user?.role !== "SUPER_ADMIN") {
      router.replace("/");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void load();
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load, user?.role]);

  function rememberPassword(adminId: string, password: string) {
    setCachedAdminPassword(adminId, password);
    setPasswords((current) => ({ ...current, [adminId]: password }));
  }

  async function ensurePassword(admin: AdminUser): Promise<string> {
    const existing = passwords[admin.id] ?? getCachedAdminPasswords()[admin.id] ?? null;
    if (existing) {
      return existing;
    }
    const result = await resetAdminPassword(admin.id);
    rememberPassword(admin.id, result.temporaryPassword);
    return result.temporaryPassword;
  }

  async function handleCopyPassword(admin: AdminUser) {
    setCopyBusyId(admin.id);
    try {
      const password = await ensurePassword(admin);
      await copyText(password);
      notify("Password copied");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to copy password.", "error");
    } finally {
      setCopyBusyId(null);
    }
  }

  async function handleRevealPassword(admin: AdminUser) {
    if (passwords[admin.id] ?? getCachedAdminPasswords()[admin.id]) {
      return;
    }
    setCopyBusyId(admin.id);
    try {
      await ensurePassword(admin);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to show password.", "error");
      throw err;
    } finally {
      setCopyBusyId(null);
    }
  }

  async function handleCreate(values: AdminFormValues) {
    setFormBusy(true);
    try {
      const created = await createAdmin(values);
      const password =
        created.temporaryPassword ?? (values.temporaryPassword.trim() || null);
      if (password) {
        rememberPassword(created.user.id, password);
      }
      setFormMode(null);
      notify("Administrator added.");
      await load();
      if (password) {
        rememberPassword(created.user.id, password);
      }
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to create administrator.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleEdit(values: AdminFormValues) {
    if (!editing) {
      return;
    }
    setFormBusy(true);
    try {
      const updated = await updateAdmin(editing.id, values);
      setFormMode(null);
      setEditing(null);
      notify("Administrator updated.");
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.id === updated.id ? updated : item)),
            }
          : current,
      );
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update administrator.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleStatusChange() {
    if (!statusTarget) {
      return;
    }
    setStatusBusyId(statusTarget.id);
    const nextStatus = statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const updated = await updateAdminStatus(statusTarget.id, nextStatus);
      setStatusTarget(null);
      notify(nextStatus === "ACTIVE" ? "Administrator activated" : "Administrator deactivated");
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.id === updated.id ? updated : item)),
            }
          : current,
      );
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update status.", "error");
    } finally {
      setStatusBusyId(null);
    }
  }

  if (authLoading || user?.role !== "SUPER_ADMIN") {
    return <p className="text-sm text-muted">Checking access…</p>;
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <PageHeader
          title="Administrators"
          description="Team administrators who manage members, customers, and invoices."
          actions={<Button onClick={() => setFormMode("create")}>Add administrator</Button>}
        />
      ) : (
        <div className="flex justify-end">
          <Button onClick={() => setFormMode("create")}>Add administrator</Button>
        </div>
      )}

      <form
        className="flex w-full flex-wrap items-end gap-6 rounded-2xl border border-border bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <div className="w-64 max-w-full">
          <Field label="Search" htmlFor="admin-search">
            <TextInput
              id="admin-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search administrators"
            />
          </Field>
        </div>
        <div className="w-40">
          <Field label="Status" htmlFor="admin-status">
            <SelectInput
              id="admin-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AccountStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </SelectInput>
          </Field>
        </div>
        <Button type="submit" variant="secondary">
          Apply filters
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Loading administrators…</p>
      ) : error ? (
        <ErrorState title="We couldn't load administrators." message={error} onRetry={() => void load()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title="No administrators yet"
          description="Add an administrator who can create and manage their own members."
          action={<Button onClick={() => setFormMode("create")}>Add administrator</Button>}
        />
      ) : (
        <DataTable
          footer={<Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />}
        >
          <Table>
            <THead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Password</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <tbody>
              {result.items.map((admin) => (
                <tr key={admin.id} className="border-t border-border hover:bg-muted-soft">
                  <Td>
                    <span className="font-medium">
                      {admin.firstName} {admin.lastName}
                    </span>
                  </Td>
                  <Td muted>{admin.email}</Td>
                  <Td>
                    <MemberPasswordCell
                      password={passwords[admin.id] ?? null}
                      copying={copyBusyId === admin.id}
                      onCopy={() => handleCopyPassword(admin)}
                      onReveal={() => handleRevealPassword(admin)}
                    />
                  </Td>
                  <Td>
                    <StatusBadge status={admin.status} />
                  </Td>
                  <Td className="text-right">
                    <ActionGroup>
                      <EditAction
                        onClick={() => {
                          setEditing(admin);
                          setFormMode("edit");
                        }}
                      />
                      <StatusAction
                        active={admin.status === "ACTIVE"}
                        loading={statusBusyId === admin.id}
                        disabled={Boolean(statusBusyId && statusBusyId !== admin.id)}
                        onClick={() => setStatusTarget(admin)}
                      />
                    </ActionGroup>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataTable>
      )}

      {formMode === "create" ? (
        <AdministratorForm
          title="Add administrator"
          mode="create"
          persistKey="admin-form:create"
          busy={formBusy}
          onClose={() => setFormMode(null)}
          onSubmit={handleCreate}
        />
      ) : null}

      {formMode === "edit" && editing ? (
        <AdministratorForm
          title="Edit administrator"
          mode="edit"
          persistKey={`admin-form:edit:${editing.id}`}
          initialValues={valuesFromAdmin(editing)}
          busy={formBusy}
          onClose={() => {
            setFormMode(null);
            setEditing(null);
          }}
          onSubmit={handleEdit}
        />
      ) : null}

      {statusTarget ? (
        <ConfirmDialog
          title={statusTarget.status === "ACTIVE" ? "Deactivate Administrator?" : "Activate Administrator?"}
          message={
            statusTarget.status === "ACTIVE"
              ? "Are you sure you want to deactivate this administrator? They will no longer be able to access the system."
              : `${statusTarget.firstName} ${statusTarget.lastName} will be able to sign in again.`
          }
          confirmLabel={statusTarget.status === "ACTIVE" ? "Deactivate" : "Activate"}
          danger={statusTarget.status === "ACTIVE"}
          busy={statusBusyId === statusTarget.id}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() => void handleStatusChange()}
        />
      ) : null}
    </div>
  );
}

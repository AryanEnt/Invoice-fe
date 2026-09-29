"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActionGroup,
  EditAction,
  ResetPasswordAction,
  StatusAction,
} from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { CredentialsDialog, type OneTimeCredentials } from "@/components/credentials-dialog";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AdministratorForm,
  valuesFromAdmin,
} from "@/features/administrators/administrator-form";
import { ApiError } from "@/lib/api/types";
import { purgeLegacyCredentialStorage } from "@/lib/legacy-credential-storage";
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

export function AdministratorsPage({ embedded = false }: { embedded?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();

  const [result, setResult] = useState<AdminListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetBusyId, setResetBusyId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<OneTimeCredentials | null>(null);

  useEffect(() => {
    purgeLegacyCredentialStorage();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const admins = await listAdmins({
        search: search || undefined,
        page,
        pageSize: 10,
      });
      setResult(admins);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load administrators.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

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

  function replaceAdmin(updated: AdminUser) {
    setResult((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) => (item.id === updated.id ? updated : item)),
          }
        : current,
    );
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
      replaceAdmin(updated);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update status.", "error");
    } finally {
      setStatusBusyId(null);
    }
  }

  async function handleResetPassword() {
    if (!resetTarget) {
      return;
    }
    setResetBusyId(resetTarget.id);
    try {
      const reset = await resetAdminPassword(resetTarget.id);
      setResetTarget(null);
      setCredentials({
        title: "Password reset successfully",
        email: reset.user.email,
        temporaryPassword: reset.temporaryPassword,
      });
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to reset password.", "error");
    } finally {
      setResetBusyId(null);
    }
  }

  async function handleCreate(values: AdminFormValues) {
    setFormBusy(true);
    try {
      const created = await createAdmin(values);
      setFormMode(null);
      setCredentials({
        title: "Administrator created successfully",
        email: created.user.email,
        temporaryPassword: created.temporaryPassword,
      });
      await load();
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
      replaceAdmin(updated);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update administrator.", "error");
    } finally {
      setFormBusy(false);
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
                      <ResetPasswordAction
                        loading={resetBusyId === admin.id}
                        disabled={Boolean(resetBusyId && resetBusyId !== admin.id)}
                        onClick={() => setResetTarget(admin)}
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
          title={
            statusTarget.status === "ACTIVE" ? "Deactivate Administrator?" : "Activate Administrator?"
          }
          message={
            statusTarget.status === "ACTIVE"
              ? `${statusTarget.firstName} ${statusTarget.lastName} will be signed out and will no longer be able to access the system.`
              : `${statusTarget.firstName} ${statusTarget.lastName} will be able to sign in again.`
          }
          confirmLabel={statusTarget.status === "ACTIVE" ? "Deactivate" : "Activate"}
          danger={statusTarget.status === "ACTIVE"}
          busy={statusBusyId === statusTarget.id}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() => void handleStatusChange()}
        />
      ) : null}

      {resetTarget ? (
        <ConfirmDialog
          title="Reset password?"
          message={`A new temporary password will be generated for ${resetTarget.email}. Their current password will stop working immediately and they will be signed out.`}
          confirmLabel="Reset password"
          danger
          busy={resetBusyId === resetTarget.id}
          onCancel={() => setResetTarget(null)}
          onConfirm={() => void handleResetPassword()}
        />
      ) : null}

      {credentials ? (
        <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
      ) : null}
    </div>
  );
}

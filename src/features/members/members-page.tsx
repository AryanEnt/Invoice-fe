"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ActionGroup, EditAction, StatusAction } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { CredentialsDialog, type OneTimeCredentials } from "@/components/credentials-dialog";
import { KnownPasswordCell } from "@/components/known-password-cell";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { MemberForm, valuesFromMember } from "@/features/members/member-form";
import { ApiError } from "@/lib/api/types";
import { copyText } from "@/lib/copy-text";
import { purgeLegacyCredentialStorage } from "@/lib/legacy-credential-storage";
import { MAX_PAGE_SIZE } from "@/lib/pagination";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { listAdmins } from "@/services/admins.service";
import {
  createMember,
  listMemberAdministrators,
  listMembers,
  resetMemberPassword,
  setMemberPassword,
  updateMember,
  updateMemberStatus,
} from "@/services/members.service";
import type { AdministratorSummary } from "@/types/member";
import type { AccountStatus } from "@/types/auth";
import type { MemberFormValues, MemberListResult, MemberUser } from "@/types/member";

export function MembersPage({ embedded = false }: { embedded?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const { organizationId, tenantListsReady, scopeLabel } = useWorkspace();
  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const canCreate = canManage;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [result, setResult] = useState<MemberListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [administratorId, setAdministratorId] = useState<"" | "none" | string>("");
  const [administrators, setAdministrators] = useState<AdministratorSummary[]>([]);
  const [unassignedMemberCount, setUnassignedMemberCount] = useState(0);
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<MemberUser | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [statusTarget, setStatusTarget] = useState<MemberUser | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<OneTimeCredentials | null>(null);
  // Passwords set during this visit only; never persisted and gone on refresh.
  const [knownPasswords, setKnownPasswords] = useState<Record<string, string>>({});
  const [assignableAdmins, setAssignableAdmins] = useState<AdministratorSummary[]>([]);

  useEffect(() => {
    purgeLegacyCredentialStorage();
  }, []);

  useEffect(() => {
    if (!isSuperAdmin || formMode !== "create") {
      return;
    }
    let cancelled = false;
    void listAdmins({ status: "ACTIVE", page: 1, pageSize: MAX_PAGE_SIZE })
      .then((admins) => {
        if (!cancelled) {
          setAssignableAdmins(admins.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAssignableAdmins([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [formMode, isSuperAdmin]);

  const load = useCallback(async () => {
    if (!isSuperAdmin && !tenantListsReady) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const members = await listMembers({
        search: search || undefined,
        status,
        organizationId: isSuperAdmin ? undefined : organizationId || undefined,
        administratorId: isSuperAdmin && administratorId ? administratorId : undefined,
        page,
        pageSize: 10,
      });
      setResult(members);
      if (isSuperAdmin) {
        const options = await listMemberAdministrators();
        setAdministrators(options.items);
        setUnassignedMemberCount(options.unassignedCount);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load members.");
    } finally {
      setLoading(false);
    }
  }, [administratorId, isSuperAdmin, organizationId, page, search, status, tenantListsReady]);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }

    let cancelled = false;

    void listMemberAdministrators()
      .then((result) => {
        if (!cancelled) {
          setAdministrators(result.items);
          setUnassignedMemberCount(result.unassignedCount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdministrators([]);
          setUnassignedMemberCount(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!authLoading && !canManage) {
      router.replace("/");
    }
  }, [authLoading, canManage, router]);

  useEffect(() => {
    if (!canManage) {
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
  }, [canManage, load]);

  function rememberPassword(memberId: string, password: string) {
    setKnownPasswords((current) => ({ ...current, [memberId]: password }));
  }

  async function handleCopyPassword(password: string): Promise<boolean> {
    try {
      await copyText(password);
      notify("Password copied");
      return true;
    } catch {
      notify("Unable to copy password.", "error");
      return false;
    }
  }

  async function handleResetAndCopy(member: MemberUser): Promise<boolean> {
    try {
      const { temporaryPassword } = await resetMemberPassword(member.id);
      rememberPassword(member.id, temporaryPassword);
      try {
        await copyText(temporaryPassword);
        notify("Password copied");
        return true;
      } catch {
        setCredentials({ title: "Password reset", email: member.email, temporaryPassword });
        return false;
      }
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to copy password.", "error");
      return false;
    }
  }

  async function handleCreate(values: MemberFormValues) {
    setFormBusy(true);
    try {
      const created = await createMember({
        ...values,
        administratorId: isSuperAdmin ? values.administratorId : "",
      });
      rememberPassword(created.user.id, created.temporaryPassword);
      setFormMode(null);
      setCredentials({
        title: "Member created successfully",
        email: created.user.email,
        temporaryPassword: created.temporaryPassword,
      });
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to create member.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleEdit(values: MemberFormValues, newPassword?: string) {
    if (!editing) {
      return;
    }
    setFormBusy(true);
    try {
      const updated = await updateMember(editing.id, values);
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === updated.user.id ? updated.user : item,
              ),
            }
          : current,
      );
      if (newPassword) {
        try {
          await setMemberPassword(editing.id, newPassword);
          rememberPassword(editing.id, newPassword);
        } catch (err) {
          notify(
            err instanceof ApiError
              ? `Details saved, but the password was not changed: ${err.message}`
              : "Details saved, but the password was not changed.",
            "error",
          );
          return;
        }
      }
      setFormMode(null);
      setEditing(null);
      notify(
        newPassword
          ? "Member updated. Password changed and they have been signed out."
          : "Member updated.",
      );
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update member.", "error");
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
      const updated = await updateMemberStatus(statusTarget.id, nextStatus);
      setStatusTarget(null);
      notify(nextStatus === "ACTIVE" ? "Member activated" : "Member deactivated");
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

  if (authLoading || !canManage) {
    return <p className="text-sm text-muted">Checking access…</p>;
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <PageHeader
          title="Members"
          description={`People who can create and work on invoices. ${scopeLabel}.`}
          actions={
            canCreate ? <Button onClick={() => setFormMode("create")}>Add member</Button> : undefined
          }
        />
      ) : canCreate ? (
        <div className="flex justify-end">
          <Button onClick={() => setFormMode("create")}>Add member</Button>
        </div>
      ) : null}

      <form
        className="flex w-full flex-wrap items-end gap-6 rounded-2xl border border-border bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <div className="w-64 max-w-full">
          <Field label="Search" htmlFor="member-search">
            <TextInput
              id="member-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search members"
            />
          </Field>
        </div>
        <div className="w-40">
          <Field label="Status" htmlFor="member-status-filter">
            <SelectInput
              id="member-status-filter"
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
        {isSuperAdmin ? (
          <div className="w-56 max-w-full">
            <Field label="Added by" htmlFor="member-admin-filter">
              <SelectInput
                id="member-admin-filter"
                value={administratorId}
                onChange={(event) => {
                  setAdministratorId(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All added by</option>
                {administrators.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.firstName} {admin.lastName}
                  </option>
                ))}
                {unassignedMemberCount > 0 ? (
                  <option value="none">Unassigned</option>
                ) : null}
              </SelectInput>
            </Field>
          </div>
        ) : null}
        <Button type="submit" variant="secondary">
          Apply filters
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Loading members…</p>
      ) : error ? (
        <ErrorState title="We couldn't load members." message={error} onRetry={() => void load()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title="No members yet"
          description="Add a member so they can work with invoices."
          action={
            canCreate ? <Button onClick={() => setFormMode("create")}>Add member</Button> : null
          }
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
                {isSuperAdmin ? <Th>Added by</Th> : null}
                <Th>Password</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <tbody>
              {result.items.map((member) => (
                <tr key={member.id} className="border-t border-border hover:bg-muted-soft">
                  <Td>
                    <Link href={`/members/${member.id}`} className="font-medium hover:underline">
                      {member.firstName} {member.lastName}
                    </Link>
                  </Td>
                  <Td muted>{member.email}</Td>
                  {isSuperAdmin ? (
                    <Td muted>
                      {member.administrator ? (
                        <span>
                          {member.administrator.firstName} {member.administrator.lastName}
                          <span className="block text-xs">{member.administrator.email}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                  ) : null}
                  <Td>
                    <KnownPasswordCell
                      password={knownPasswords[member.id]}
                      onCopy={handleCopyPassword}
                      onRequestNew={() => handleResetAndCopy(member)}
                    />
                  </Td>
                  <Td>
                    <StatusBadge status={member.status} />
                  </Td>
                  <Td className="text-right">
                    <ActionGroup>
                      <EditAction
                        onClick={() => {
                          setEditing(member);
                          setFormMode("edit");
                        }}
                      />
                      <StatusAction
                        active={member.status === "ACTIVE"}
                        loading={statusBusyId === member.id}
                        disabled={Boolean(statusBusyId && statusBusyId !== member.id)}
                        onClick={() => setStatusTarget(member)}
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
        <MemberForm
          title="Add member"
          mode="create"
          persistKey="member-form:create"
          initialValues={{ organizationId: organizationId ?? "" }}
          administrators={isSuperAdmin ? assignableAdmins : undefined}
          busy={formBusy}
          onClose={() => setFormMode(null)}
          onSubmit={handleCreate}
        />
      ) : null}

      {formMode === "edit" && editing ? (
        <MemberForm
          title="Edit member"
          mode="edit"
          persistKey={`member-form:edit:${editing.id}`}
          initialValues={valuesFromMember(editing)}
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
          title={statusTarget.status === "ACTIVE" ? "Deactivate Member?" : "Activate Member?"}
          message={
            statusTarget.status === "ACTIVE"
              ? "Are you sure you want to deactivate this member? They will no longer be able to access the system."
              : `${statusTarget.firstName} ${statusTarget.lastName} will be able to sign in again.`
          }
          confirmLabel={statusTarget.status === "ACTIVE" ? "Deactivate" : "Activate"}
          danger={statusTarget.status === "ACTIVE"}
          busy={statusBusyId === statusTarget.id}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() => void handleStatusChange()}
        />
      ) : null}

      {credentials ? (
        <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
      ) : null}
    </div>
  );
}

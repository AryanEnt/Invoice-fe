"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ActionGroup, EditAction, StatusAction } from "@/components/ui/action-buttons";
import { ConfirmDialog } from "@/components/ui/dialog";
import { MemberForm, valuesFromMember } from "@/features/members/member-form";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { getMember, updateMember, updateMemberStatus } from "@/services/members.service";
import type { MemberFormValues, MemberUser } from "@/types/member";

interface MemberDetailPageProps {
  memberId: string;
}

export function MemberDetailPage({ memberId }: MemberDetailPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [member, setMember] = useState<MemberUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const memberData = await getMember(memberId);
      setMember(memberData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load member.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

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

  async function handleEdit(values: MemberFormValues) {
    setFormBusy(true);
    try {
      await updateMember(memberId, values);
      setEditing(false);
      notify("Member updated");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update member.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleStatus() {
    if (!member) {
      return;
    }
    setStatusBusy(true);
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateMemberStatus(member.id, nextStatus);
      setStatusConfirm(false);
      notify(nextStatus === "ACTIVE" ? "Member activated" : "Member deactivated");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update member status.", "error");
    } finally {
      setStatusBusy(false);
    }
  }

  if (authLoading || !canManage) {
    return <p className="text-sm text-muted">Checking access…</p>;
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
        Loading member…
      </div>
    );
  }

  if (error || !member) {
    return (
      <div role="alert" className="rounded-2xl border border-border bg-primary-soft p-6 text-sm text-primary">
        {error ?? "Member not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-muted">
            <Link href="/members" className="hover:underline">
              Members
            </Link>
            <span className="mx-2">/</span>
            {member.firstName} {member.lastName}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            {member.firstName} {member.lastName}
          </h2>
          <p className="mt-1 text-sm text-muted">{member.email}</p>
        </div>
        {canManage ? (
          <ActionGroup>
            <EditAction onClick={() => setEditing(true)} />
            <StatusAction
              active={member.status === "ACTIVE"}
              onClick={() => setStatusConfirm(true)}
            />
          </ActionGroup>
        ) : null}
      </div>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Status</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {member.status === "ACTIVE" ? "Active" : "Inactive"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Administrator</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {member.administrator
              ? `${member.administrator.firstName} ${member.administrator.lastName}`
              : "—"}
          </p>
        </div>
      </section>

      {editing ? (
        <MemberForm
          title="Edit member"
          mode="edit"
          persistKey={`member-form:edit:${member.id}`}
          initialValues={valuesFromMember(member)}
          busy={formBusy}
          onClose={() => setEditing(false)}
          onSubmit={handleEdit}
        />
      ) : null}

      {statusConfirm ? (
        <ConfirmDialog
          title={member.status === "ACTIVE" ? "Deactivate member" : "Activate member"}
          message={
            member.status === "ACTIVE"
              ? `${member.firstName} ${member.lastName} will no longer be able to sign in.`
              : `${member.firstName} ${member.lastName} will be able to sign in again.`
          }
          confirmLabel={member.status === "ACTIVE" ? "Deactivate" : "Activate"}
          danger={member.status === "ACTIVE"}
          busy={statusBusy}
          onCancel={() => setStatusConfirm(false)}
          onConfirm={() => void handleStatus()}
        />
      ) : null}
    </div>
  );
}

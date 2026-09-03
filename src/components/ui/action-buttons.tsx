import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="inline-flex flex-wrap items-center justify-end gap-2">{children}</div>;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M11.2 2.5a1.4 1.4 0 0 1 2 2L6.1 11.6 3 12.5l.9-3.1 7.3-6.9Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M8 1.8v4.2M11.8 3.4A5.2 5.2 0 1 1 4.2 3.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.5 8.2 6.6 11.2 12.5 4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.5 5h9M6 5V3.6A.6.6 0 0 1 6.6 3h2.8a.6.6 0 0 1 .6.6V5M5.2 5l.4 7.2a.8.8 0 0 0 .8.7h3.2a.8.8 0 0 0 .8-.7L10.8 5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M1.5 8s2.2-4 6.5-4 6.5 4 6.5 4-2.2 4-6.5 4-6.5-4-6.5-4Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

type MemberActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  tone: "view" | "edit" | "deactivate" | "activate" | "delete";
};

function MemberActionButton({ className, loading, disabled, tone, children, ...props }: MemberActionProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn("member-action-btn", tone, className)}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M6.7 9.3a3.2 3.2 0 0 0 4.5 0l1.3-1.3a3.2 3.2 0 0 0-4.5-4.5L7.2 4.3M9.3 6.7a3.2 3.2 0 0 0-4.5 0L3.5 8a3.2 3.2 0 0 0 4.5 4.5l.8-.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 5.2 8 9l5-3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CopyLinkAction({
  onClick,
  disabled,
  loading,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <MemberActionButton tone="view" onClick={onClick} disabled={disabled} loading={loading} title="Copy invoice link">
      <LinkIcon />
      Copy Link
    </MemberActionButton>
  );
}

export function SendEmailAction({
  onClick,
  disabled,
  loading,
  label = "Send Email",
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}) {
  return (
    <MemberActionButton
      tone={label === "Retry" ? "deactivate" : "edit"}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      title={label}
    >
      <MailIcon />
      {label}
    </MemberActionButton>
  );
}

export function EditAction({
  onClick,
  disabled,
  loading,
  mode = "edit",
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  mode?: "edit" | "view";
}) {
  return (
    <MemberActionButton
      tone={mode}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {mode === "view" ? <EyeIcon /> : <PencilIcon />}
      {mode === "view" ? "View" : "Edit"}
    </MemberActionButton>
  );
}

/** @deprecated Use EditAction with mode="view" */
export function ViewAction(props: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return <EditAction mode="view" {...props} />;
}

export function StatusAction({
  active,
  onClick,
  disabled,
  loading,
}: {
  active: boolean;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <MemberActionButton
      tone={active ? "deactivate" : "activate"}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {active ? <PowerIcon /> : <CheckIcon />}
      {active ? "Deactivate" : "Activate"}
    </MemberActionButton>
  );
}

export function CancelAction({
  onClick,
  disabled,
  loading,
  label = "Cancel",
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}) {
  return (
    <MemberActionButton tone="deactivate" onClick={onClick} disabled={disabled} loading={loading}>
      <XIcon />
      {label}
    </MemberActionButton>
  );
}

export function DeleteAction({
  onClick,
  disabled,
  loading,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <MemberActionButton tone="delete" onClick={onClick} disabled={disabled} loading={loading}>
      <TrashIcon />
      Delete
    </MemberActionButton>
  );
}

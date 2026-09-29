import { SendIcon } from "./auth-icons";

export function ReminderCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-auth-border bg-auth-card p-4 shadow-[0_16px_40px_rgb(26_32_39/0.12)] ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-auth-green-tint text-auth-green">
        <SendIcon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-bold text-auth-ink">Reminder sent</p>
        <p className="mt-0.5 text-xs leading-relaxed text-auth-muted">
          Client notified about invoice #0187, due in 2 days.
        </p>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title: string;
  message?: string | null;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="rounded-2xl border border-border bg-primary-soft px-5 py-6">
      <h2 className="text-sm font-semibold text-primary">{title}</h2>
      {message ? <p className="mt-1 text-sm text-foreground">{message}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

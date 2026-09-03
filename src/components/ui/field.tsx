import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useState } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const controlClass =
  "w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none transition-colors hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted-soft disabled:text-muted aria-[invalid=true]:border-danger";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function PhoneInput({
  onChange,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <TextInput
      {...props}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      onChange={(event) => {
        event.target.value = event.target.value.replace(/\D/g, "");
        onChange?.(event);
      }}
    />
  );
}

export function PasswordInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <TextInput
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted transition-colors hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((current) => !current)}
        tabIndex={-1}
      >
        {visible ? (
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path
              d="M6.2 6.4A2.2 2.2 0 0 0 6 8c0 1.2 1 2.2 2.2 2.2.6 0 1.1-.2 1.5-.6M4.1 4.7C2.9 5.6 1.9 6.9 1.5 8s2.2 4 6.5 4c1.2 0 2.3-.3 3.2-.8M10.8 10.8C9.9 11.4 8.9 11.8 8 11.8c-2.1 0-3.8-1.7-3.8-3.8 0-.9.3-1.8.8-2.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
              d="M1.5 8s2.2-4 6.5-4 6.5 4 6.5 4-2.2 4-6.5 4-6.5-4-6.5-4Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClass, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, className)} {...props} />;
}

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Checkbox({ label, id, className, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 text-sm text-foreground">
      <input
        id={id}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring/20",
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
}

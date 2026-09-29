import type { InputHTMLAttributes, ReactNode, Ref } from "react";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

export function AuthInput({ id, label, icon, trailing, className = "", ref, ...props }: AuthInputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-auth-ink">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-auth-muted">
          {icon}
        </span>
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-[10px] border-[1.5px] border-auth-border bg-auth-panel py-3 pl-11 text-[15px] text-auth-ink outline-none transition-colors placeholder:text-auth-muted focus:border-auth-green focus:bg-auth-card aria-invalid:border-red-400 ${trailing ? "pr-12" : "pr-4"} ${className}`}
          {...props}
        />
        {trailing ? (
          <span className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</span>
        ) : null}
      </div>
    </div>
  );
}

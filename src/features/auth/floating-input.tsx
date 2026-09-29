import type { ComponentProps, ReactNode } from "react";

export type FloatingInputProps = Omit<ComponentProps<"input">, "id" | "placeholder"> & {
  id: string;
  label: string;
  error?: string;
  /** Absolutely positioned control rendered inside the field (e.g. a visibility toggle). */
  trailing?: ReactNode;
};

/** Text input whose label sits inside the field and floats above the value. */
export function FloatingInput({
  id,
  label,
  error,
  trailing,
  className = "",
  ...props
}: FloatingInputProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <div className="relative">
        <input
          {...props}
          id={id}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`peer block w-full rounded-lg border-[1.5px] border-transparent bg-field px-4 pb-2.5 pt-6 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 focus:border-leaf focus:ring-4 focus:ring-leaf/20 focus-visible:outline-none aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20 autofill:shadow-[inset_0_0_0_1000px_var(--auth-field)] autofill:[-webkit-text-fill-color:var(--auth-ink)] ${
            trailing ? "pr-12" : ""
          } ${className}`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-ink/60 transition-all duration-150 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-leaf-dark"
        >
          {label}
        </label>
        {trailing}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

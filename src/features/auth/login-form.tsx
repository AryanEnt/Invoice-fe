"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FloatingInput } from "@/features/auth/floating-input";
import { InvoiceHubLogo } from "@/features/auth/invoicehub-logo";
import { PasswordInput } from "@/features/auth/password-input";
import { useTurnstile } from "@/hooks/use-turnstile";
import { formatApiErrorMessage } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

/** Only same-origin paths are allowed as a post-login destination. */
function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}

export function LoginForm() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("next"));
  const [formError, setFormError] = useState<string | null>(null);
  const {
    getToken,
    reset: resetTurnstile,
    loaded: turnstileLoaded,
    error: turnstileError,
    containerRef,
  } = useTurnstile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (user) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router, user]);

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const turnstileToken = await getToken();
      await login(values.email, values.password, turnstileToken || undefined);
      router.replace(redirectTo);
    } catch (err) {
      resetTurnstile();
      setFormError(
        formatApiErrorMessage(err, "We couldn't sign you in. Check your email and password."),
      );
    }
  }

  const bannerError = turnstileError || formError;

  return (
    <div className="w-full">
      <InvoiceHubLogo />

      <h2 id="login-heading" className="mt-10 text-[28px] font-extrabold leading-tight tracking-tight">
        Sign in to your account
      </h2>
      <p className="mt-2 text-[15px] text-ink/65">
        Enter your email and password to manage your invoices.
      </p>

      <form
        noValidate
        aria-labelledby="login-heading"
        className="mt-8 space-y-4"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      >
        <div aria-live="assertive">
          {bannerError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
            >
              {bannerError}
            </p>
          ) : null}
        </div>

        <FloatingInput
          id="login-email"
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          id="login-password"
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div ref={containerRef} className="empty:hidden" />

        <button
          type="submit"
          disabled={isSubmitting || !turnstileLoaded}
          aria-busy={isSubmitting || undefined}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-leaf py-4 text-[15px] font-bold text-[#04210f] transition-colors hover:bg-leaf-hover disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-leaf"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

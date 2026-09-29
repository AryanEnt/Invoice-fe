"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTurnstile } from "@/hooks/use-turnstile";
import { formatApiErrorMessage } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { AuthInput } from "./auth-input";
import { MailIcon } from "./auth-icons";
import { InvoiceHubLogo } from "./invoicehub-logo";
import { PasswordInput } from "./password-input";

const ERROR_ID = "login-error";

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

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
  } = useTurnstile({ theme: "light" });

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

  const errorMessage =
    errors.email?.message ?? errors.password?.message ?? formError ?? turnstileError;

  return (
    <div className="w-full">
      <InvoiceHubLogo />

      <h1 id="login-heading" className="mt-10 text-[28px] font-extrabold tracking-tight text-auth-ink">
        Welcome back
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-auth-muted">
        Sign in to create invoices, track payments and manage your clients.
      </p>

      <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
        <AuthInput
          id="login-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          icon={<MailIcon className="h-[18px] w-[18px]" />}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? ERROR_ID : undefined}
          {...register("email")}
        />

        <PasswordInput
          id="login-password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? ERROR_ID : undefined}
          {...register("password")}
        />

        <div aria-live="assertive">
          {errorMessage ? (
            <p
              id={ERROR_ID}
              role="alert"
              className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !turnstileLoaded}
          className="w-full rounded-[10px] bg-auth-green py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-auth-green-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-green disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <div ref={containerRef} className="flex justify-center empty:hidden" />
      </form>
    </div>
  );
}

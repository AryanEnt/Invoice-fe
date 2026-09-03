"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { loginSchema } from "@/schemas/auth";

export function LoginForm() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(searchParams.get("next") || "/");
    }
  }, [router, searchParams, user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await login(parsed.data.email, parsed.data.password);
      router.replace(searchParams.get("next") || "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't sign you in. Check your email and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-3xl border border-border bg-surface p-6"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field label="Email" htmlFor="login-email" required>
        <TextInput
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </Field>
      <Field label="Password" htmlFor="login-password" required>
        <div className="relative">
          <TextInput
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pr-11"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </Field>
      {error ? (
        <p className="text-sm text-primary" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M2 8s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M2 8s2.2-4 6-4c1.2 0 2.3.4 3.2 1M14 8s-2.2 4-6 4c-1.2 0-2.3-.4-3.2-1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="m3 3 10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

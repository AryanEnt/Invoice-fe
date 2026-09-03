import { Suspense } from "react";
import { AppLogo } from "@/components/brand/app-logo";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <AppLogo variant="login" size="lg" priority className="rounded-2xl" />
        <div className="w-[94%]">
          <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

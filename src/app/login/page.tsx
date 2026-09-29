import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { AuthHero } from "@/features/auth/auth-hero";
import { LoginForm } from "@/features/auth/login-form";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sign in | InvoiceHub",
};

export default function LoginPage() {
  return (
    <main
      className={`${jakarta.variable} grid min-h-screen flex-1 bg-auth-bg font-jakarta text-ink [color-scheme:light_dark] min-[900px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]`}
    >
      <AuthHero />
      <section
        aria-labelledby="login-heading"
        className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-10"
      >
        <div className="w-full max-w-[420px]">
          <Suspense fallback={<p className="text-sm text-ink/60">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

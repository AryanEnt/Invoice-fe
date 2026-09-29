import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { AuthIllustration } from "@/features/auth/auth-illustration";
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
      className={`${jakarta.variable} auth-light grid min-h-screen flex-1 bg-auth-bg font-jakarta text-auth-ink min-[920px]:grid-cols-[1fr_1.1fr]`}
    >
      <section
        aria-labelledby="login-heading"
        className="flex items-center justify-center px-6 py-10 sm:px-10"
      >
        <div className="w-full max-w-[400px]">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
      <AuthIllustration />
    </main>
  );
}

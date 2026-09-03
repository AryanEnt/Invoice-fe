import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { AuthProvider } from "@/providers/auth-provider";
import { ToastProvider } from "@/providers/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice Hub",
  description: "Office invoicing and business management",
  icons: {
    icon: "/tablogo.png",
    shortcut: "/tablogo.png",
    apple: "/tablogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

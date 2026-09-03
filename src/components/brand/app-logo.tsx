import Image from "next/image";
import { cn } from "@/lib/cn";

type AppLogoProps = {
  className?: string;
  /** `login` = full marketing logo; `sidebar` = dashboard logo with tagline */
  variant?: "login" | "sidebar";
  size?: "sm" | "sidebar" | "lg";
  priority?: boolean;
};

const SIZES = {
  sm: { width: 48, height: 48, className: "h-8 w-auto" },
  sidebar: { width: 200, height: 67, className: "h-10 w-auto max-w-full" },
  lg: { width: 960, height: 320, className: "h-auto w-full max-w-md" },
} as const;

const VARIANT_SRC = {
  login: "/logo.png",
  sidebar: "/dashLogo.png",
} as const;

export function AppLogo({
  className,
  variant = "login",
  size,
  priority = false,
}: AppLogoProps) {
  const resolvedSize = size ?? (variant === "sidebar" ? "sidebar" : "lg");
  const dims = SIZES[resolvedSize];

  return (
    <Image
      src={VARIANT_SRC[variant]}
      alt="Invoice Hub"
      width={dims.width}
      height={dims.height}
      className={cn("object-contain object-left", dims.className, className)}
      priority={priority}
    />
  );
}

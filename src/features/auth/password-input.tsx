"use client";

import { useState, type ComponentProps } from "react";
import { AuthInput } from "./auth-input";
import { EyeIcon, EyeOffIcon, LockIcon } from "./auth-icons";

type PasswordInputProps = Omit<ComponentProps<typeof AuthInput>, "type" | "icon" | "trailing">;

export function PasswordInput({ id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthInput
      id={id}
      type={visible ? "text" : "password"}
      icon={<LockIcon className="h-[18px] w-[18px]" />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-controls={id}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-auth-muted transition-colors hover:text-auth-ink focus-visible:outline-2 focus-visible:outline-auth-green"
        >
          {visible ? (
            <EyeOffIcon className="h-[18px] w-[18px]" />
          ) : (
            <EyeIcon className="h-[18px] w-[18px]" />
          )}
        </button>
      }
      {...props}
    />
  );
}

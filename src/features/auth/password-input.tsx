"use client";

import { useState } from "react";
import { FloatingInput, type FloatingInputProps } from "@/features/auth/floating-input";

export function PasswordInput(props: Omit<FloatingInputProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);

  return (
    <FloatingInput
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          className="absolute inset-y-0 right-2 my-auto flex h-10 w-10 items-center justify-center rounded-md text-ink/55 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-leaf"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-controls={props.id}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M2 10s2.9-5.5 8-5.5S18 10 18 10s-2.9 5.5-8 5.5S2 10 2 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M8.2 4.7A7.6 7.6 0 0 1 10 4.5c5.1 0 8 5.5 8 5.5a14 14 0 0 1-2.3 3M5.6 5.9C3.3 7.4 2 10 2 10s2.9 5.5 8 5.5c1.5 0 2.8-.5 3.9-1.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.2 8.3a2.5 2.5 0 0 0 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m3 3 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

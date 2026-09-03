"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const KEY = "outinvoice.onboarding";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return window.localStorage.getItem(KEY) !== "done";
}

function getServerSnapshot() {
  return false;
}

export function OnboardingCard() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(KEY, "done");
    window.dispatchEvent(new Event("storage"));
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Welcome. Let’s get your account ready.</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Add a customer you will bill</li>
            <li>Create your first invoice</li>
          </ol>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/customers">
            <Button>Start setup</Button>
          </Link>
          <Button variant="ghost" onClick={dismiss}>
            Skip for now
          </Button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { cn } from "@/lib/cn";

export interface StepDefinition {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepDefinition[];
  current: number;
  highestReached: number;
  onStepSelect?: (index: number) => void;
}

export function Stepper({ steps, current, highestReached, onStepSelect }: StepperProps) {
  return (
    <nav aria-label="Form steps">
      <ol className="hidden gap-2 md:flex">
        {steps.map((step, index) => {
          const complete = index < current;
          const active = index === current;
          const reachable = index <= highestReached;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!reachable || !onStepSelect}
                onClick={() => reachable && onStepSelect?.(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary/25 bg-primary-soft"
                    : complete
                      ? "border-border bg-surface hover:bg-muted-soft"
                      : "border-transparent bg-transparent",
                  reachable ? "cursor-pointer" : "cursor-default opacity-70",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    active
                      ? "bg-primary text-primary-foreground"
                      : complete
                        ? "bg-foreground text-surface"
                        : "bg-muted-soft text-muted",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {complete ? "✓" : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{step.label}</span>
                  {step.description ? (
                    <span className="hidden truncate text-xs text-muted lg:block">{step.description}</span>
                  ) : null}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span className="hidden h-px w-3 shrink-0 bg-border lg:block" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-muted md:hidden">
        Step {current + 1} of {steps.length}: <span className="font-medium text-foreground">{steps[current]?.label}</span>
      </p>
    </nav>
  );
}

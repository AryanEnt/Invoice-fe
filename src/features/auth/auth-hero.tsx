"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ClientsKpiCard, CollectedCard, StatusCard } from "@/features/auth/hero-stat-cards";
import { InvoiceCard } from "@/features/auth/invoice-card";

const SLIDES = [
  {
    label: "Invoices",
    before: "Send invoices. ",
    highlight: "Get paid",
    after: " faster.",
    body: "Create professional invoices, track payments and follow up on overdue bills, all from one place.",
  },
  {
    label: "Payments",
    before: "Every payment, ",
    highlight: "tracked",
    after: " the moment it lands.",
    body: "Record card, PayPal and bank payments and see what each client still owes at a glance.",
  },
  {
    label: "Reports",
    before: "Know your numbers ",
    highlight: "every month",
    after: ".",
    body: "Revenue, tax and outstanding balances in clear reports you can export in one click.",
  },
  {
    label: "Reminders",
    before: "Follow up on overdue bills ",
    highlight: "without the chase",
    after: ".",
    body: "Spot late invoices early and nudge clients before a small delay becomes a problem.",
  },
] as const;

const ROTATE_MS = 5000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export function AuthHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (paused || reducedMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const slide = SLIDES[active];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="InvoiceHub highlights"
      className="relative hidden flex-col items-center justify-center overflow-hidden bg-forest px-10 py-14 text-white min-[900px]:flex"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-44 h-[460px] w-[460px] rounded-full bg-[#134d33]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-40 h-[420px] w-[420px] rounded-full bg-moss"
      />

      <div className="relative z-10 flex w-full flex-col items-center">
        <div key={active} className="min-h-44 max-w-xl text-center motion-safe:animate-auth-fade-in">
          <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight xl:text-5xl">
            {slide.before}
            <span className="text-leaf">{slide.highlight}</span>
            {slide.after}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-white/75">{slide.body}</p>
        </div>

        <div
          aria-hidden
          className="relative mt-8 -mb-[68px] h-[340px] w-[520px] shrink-0 origin-top scale-[0.8] xl:mb-0 xl:scale-100"
        >
          <InvoiceCard className="absolute left-[124px] top-0 z-10 w-[250px]" />
          <ClientsKpiCard className="absolute right-0 top-4 z-20 w-[156px]" />
          <CollectedCard className="absolute bottom-0 right-0 z-20 w-[156px]" />
          <StatusCard className="absolute bottom-6 left-0 z-20 w-[140px]" />
        </div>

        <div className="mt-10 flex items-center gap-1" role="group" aria-label="Choose a highlight">
          {SLIDES.map((item, index) => {
            const isActive = index === active;
            return (
              <button
                key={item.label}
                type="button"
                className="group rounded-full p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                aria-label={`Show ${item.label}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => setActive(index)}
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    isActive ? "w-6 bg-leaf" : "w-2 bg-white/35 group-hover:bg-white/60"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

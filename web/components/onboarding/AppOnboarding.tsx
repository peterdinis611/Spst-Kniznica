"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, KeyRound, Library, Search } from "lucide-react";
import { AnimationDelayedLi } from "@/components/styled/primitives";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "spst-onboarding-dismissed";

const steps = [
  {
    n: "01",
    title: "Nájdi titul",
    body: "Filtruj knihy, autorov alebo kategórie. Celý fond beží cez školskú API bránu.",
    href: "/books",
    label: "Otvoriť katalóg",
    Icon: Search,
  },
  {
    n: "02",
    title: "Otvor detail",
    body: "Uvidíš autora, kategóriu a koľko exemplárov je práve voľných.",
    href: "/books",
    label: "Prehliadať fond",
    Icon: BookOpen,
  },
  {
    n: "03",
    title: "Prihlás sa",
    body: "Výpožičný lístok vystavíš len s účtom — meno a email sa vezmú z prihlásenia.",
    href: "/login",
    label: "K účtu",
    Icon: KeyRound,
  },
  {
    n: "04",
    title: "Rezervuj a sleduj",
    body: "Lístok nájdeš vo svojich výpožičkách. Knižník ho vydá alebo vráti na pulte.",
    href: "/library",
    label: "Moje výpožičky",
    Icon: Library,
  },
] as const;

export function AppOnboarding({ className }: { className?: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [storedDismissed, setStoredDismissed] = useState(true);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    setStoredDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  const open = hydrated && (!storedDismissed || forceOpen);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setStoredDismissed(true);
    setForceOpen(false);
  }

  return (
    <section
      className={cn("relative bg-paper", className)}
      aria-labelledby="onboarding-heading"
    >
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
        <div>
          <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-sage uppercase">
            Sprievodca
          </p>
          <h2
            id="onboarding-heading"
            className="mt-2 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[0.95] tracking-[-0.03em] text-ink"
          >
            Štyri kroky k lístku
          </h2>
        </div>
        <button
          type="button"
          onClick={() => (open ? dismiss() : setForceOpen(true))}
          className="group inline-flex items-center gap-2 pb-1 font-mono text-[11px] tracking-[0.16em] text-sage uppercase transition hover:text-ink"
        >
          {open ? "Skryť kroky" : "Otvoriť kroky"}
          <ArrowUpRight
            className={cn(
              "size-3.5 transition",
              open ? "rotate-90" : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            )}
            aria-hidden
          />
        </button>
      </header>

      <ol className="grid grid-cols-2 gap-px border-b border-rule bg-rule lg:grid-cols-4">
        {steps.map((step, index) => (
          <AnimationDelayedLi
            key={step.n}
            className="reveal flex min-h-40 flex-col bg-paper p-4 sm:min-h-44 sm:p-6"
            $delay={`${0.05 + index * 0.07}s`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className="font-display text-[clamp(2.4rem,4vw,3.5rem)] leading-none tracking-tight text-ink/15 tabular-nums"
                aria-hidden
              >
                {step.n}
              </span>
              <step.Icon className="mt-1 size-4 text-sage" strokeWidth={1.7} aria-hidden />
            </div>
            <p className="mt-4 font-display text-[1.35rem] leading-none tracking-tight text-ink sm:text-2xl">
              {step.title}
            </p>
            {open ? (
              <>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
                <Link
                  href={step.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sage underline-offset-4 transition hover:text-ink hover:underline"
                >
                  {step.label}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </>
            ) : null}
          </AnimationDelayedLi>
        ))}
      </ol>
    </section>
  );
}

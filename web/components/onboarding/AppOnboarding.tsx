"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  KeyRound,
  Library,
  Search,
} from "lucide-react";
import { AnimationDelayedLi } from "@/components/styled/primitives";
import { Button } from "@/components/ui/button";
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
    title: "Rezervuj & sleduj",
    body: "Lístok nájdeš vo svojich výpožičkách. Knižník ho vydá alebo vráti na pulte.",
    href: "/library",
    label: "Moje výpožičky",
    Icon: Library,
  },
] as const;

export function AppOnboarding({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed && !expanded) {
    return (
      <div className={cn("pt-2", className)}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group inline-flex items-baseline gap-3 text-left"
        >
          <span className="font-mono text-[10px] tracking-[0.2em] text-sage uppercase">
            Sprievodca
          </span>
          <span className="font-display text-xl tracking-tight text-ink transition group-hover:text-sage sm:text-2xl">
            Ako funguje SPST Knižnica?
          </span>
          <ChevronRight
            className="size-4 shrink-0 self-center text-sage opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
            aria-hidden
          />
        </button>
      </div>
    );
  }

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
    setExpanded(false);
  }

  return (
    <section className={cn(className)} aria-labelledby="onboarding-heading">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6 dark:border-white/12">
        <div className="max-w-lg">
          <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-eyebrow uppercase">
            Rýchly sprievodca
          </p>
          <h2
            id="onboarding-heading"
            className="mt-2 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.05] tracking-tight text-ink"
          >
            Ako appka funguje
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Štyri kroky od prehliadania fondu po vlastný výpožičný lístok.
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          4 kroky
        </p>
      </header>

      <ol className="relative mt-2">
        <span
          aria-hidden
          className="absolute top-4 bottom-4 left-[1.15rem] hidden w-px bg-gradient-to-b from-sage/50 via-rule to-transparent sm:left-[1.85rem] md:block dark:from-sage/40 dark:via-white/10"
        />

        {steps.map((step, index) => (
          <AnimationDelayedLi
            key={step.n}
            className="reveal group/step relative grid gap-3 border-b border-rule/80 py-7 last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-6 md:grid-cols-[7rem_minmax(0,1fr)_auto] md:items-start md:gap-8 dark:border-white/10"
            $delay={`${0.05 + index * 0.08}s`}
          >
            <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-4">
              <span
                className="font-display text-[clamp(2.25rem,4vw,3.25rem)] leading-none tracking-tight text-ink/12 tabular-nums transition group-hover/step:text-sage/35 dark:text-white/10 dark:group-hover/step:text-sage/40"
                aria-hidden
              >
                {step.n}
              </span>
              <span
                className={cn(
                  "relative z-10 grid size-9 place-items-center border border-sage/35 bg-mint/80 text-sage",
                  "transition group-hover/step:border-sage group-hover/step:bg-sage group-hover/step:text-paper",
                  "dark:border-sage/50 dark:bg-paper-deep dark:group-hover/step:bg-sage dark:group-hover/step:text-ink",
                  "md:size-10",
                )}
              >
                <step.Icon className="size-4" strokeWidth={1.7} />
              </span>
            </div>

            <div className="min-w-0 pt-0.5">
              <p className="font-display text-[1.35rem] leading-snug tracking-tight text-ink sm:text-[1.5rem]">
                {step.title}
              </p>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>

            <Link
              href={step.href}
              className={cn(
                "inline-flex items-center gap-1.5 self-start pt-1 text-sm font-medium text-sage",
                "underline-offset-4 transition hover:text-ink hover:underline",
                "md:justify-self-end md:pt-2",
              )}
            >
              {step.label}
              <ChevronRight
                className="size-3.5 transition group-hover/step:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </AnimationDelayedLi>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            className="h-11 rounded-none bg-ink px-6 text-paper hover:bg-ink/90 dark:bg-sage dark:text-ink dark:hover:bg-sage/90"
            onClick={dismiss}
          >
            Rozumiem, skryť
          </Button>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Nápovedu môžeš kedykoľvek znova otvoriť.
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/75 uppercase">
          Výpožičky cez API bránu
        </p>
      </div>
    </section>
  );
}

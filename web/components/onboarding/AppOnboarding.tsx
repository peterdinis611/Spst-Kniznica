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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "spst-onboarding-dismissed";

const steps = [
  {
    n: "01",
    title: "Nájdi titul",
    body: "V katalógu filtruj knihy, autorov alebo kategórie. Všetko ide cez školský gateway.",
    href: "/books",
    label: "Katalóg",
    Icon: Search,
  },
  {
    n: "02",
    title: "Otvor detail",
    body: "Na stránke knihy uvidíš autora, kategóriu a počet voľných exemplárov.",
    href: "/books",
    label: "Príklad",
    Icon: BookOpen,
  },
  {
    n: "03",
    title: "Prihlás sa",
    body: "Výpožičný lístok vystavíš len s účtom. Meno a email sa vezmú z prihlásenia.",
    href: "/login",
    label: "Účet",
    Icon: KeyRound,
  },
  {
    n: "04",
    title: "Rezervuj & sleduj",
    body: "Lístok uvidíš na výpožičnom pulte pod svojím emailom. Knižník ho vydá alebo vráti.",
    href: "/bookings",
    label: "Výpožičky",
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
      <div
        className={cn(
          "border-t border-rule pt-8 dark:border-white/10",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-ink"
        >
          <span className="border-b border-transparent transition group-hover:border-sage">
            Ako funguje SPST Knižnica?
          </span>
          <ChevronRight
            className="size-3.5 text-sage opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
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
      <div className="reveal">
        <h2
          id="onboarding-heading"
          className="text-eyebrow font-mono text-[11px] font-semibold tracking-[0.22em] uppercase"
        >
          Rýchly sprievodca
        </h2>
        <p className="mt-2 font-display text-2xl tracking-tight text-ink sm:text-3xl">
          Ako appka funguje
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Štyri kroky od prehliadania fondu po vlastný výpožičný lístok.
        </p>
      </div>

      <div className="reveal reveal-delay-1 mt-8 overflow-hidden rounded-sm border border-rule bg-card/80 shadow-[0_24px_48px_-36px_rgba(14,26,36,0.2)] dark:border-white/12 dark:bg-surface-3/80 dark:shadow-none">
        <ol className="divide-y divide-rule dark:divide-white/10">
          {steps.map((step, index) => (
            <li
              key={step.n}
              className={cn(
                "group/step relative grid gap-4 px-5 py-6 sm:grid-cols-[4.5rem_1fr_auto] sm:items-center sm:gap-5 sm:px-6 sm:py-7",
                "transition-colors hover:bg-paper-deep/50 dark:hover:bg-paper-deep/40",
              )}
              style={{ animationDelay: `${0.06 + index * 0.07}s` }}
            >
              <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-3">
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.2em] text-sage sm:text-xs"
                  aria-hidden
                >
                  {step.n}
                </span>
                <span
                  className={cn(
                    "relative z-10 flex size-11 items-center justify-center rounded-full",
                    "border border-sage/30 bg-mint/70 text-sage",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
                    "dark:border-sage/45 dark:bg-paper-deep dark:text-sage dark:shadow-none",
                    "transition group-hover/step:border-accent/50 group-hover/step:bg-accent/15",
                  )}
                >
                  <step.Icon className="size-[1.125rem]" strokeWidth={1.65} />
                </span>
              </div>

              <div className="min-w-0 sm:pr-4">
                <p className="font-display text-xl leading-snug tracking-tight text-ink sm:text-[1.35rem]">
                  {step.title}
                </p>
                <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>

              <Link
                href={step.href}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center justify-between gap-2 self-start border px-3.5 text-xs font-semibold tracking-wide",
                  "border-rule bg-paper text-ink",
                  "transition hover:border-sage/50 hover:bg-mint/40",
                  "dark:border-white/15 dark:bg-transparent dark:hover:border-sage/40 dark:hover:bg-white/5",
                  "sm:min-w-[7.5rem]",
                )}
              >
                {step.label}
                <ChevronRight
                  className="size-3.5 text-sage transition group-hover/step:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="reveal reveal-delay-2 mt-8 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="h-11 rounded-none bg-accent px-5 text-accent-foreground hover:bg-accent-deep"
            onClick={dismiss}
          >
            Rozumiem, skryť
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Nápovedu môžeš kedykoľvek znova otvoriť.
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/80 uppercase">
          4 kroky · výpožičky cez gateway
        </p>
      </div>
    </section>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  CloudOff,
  KeyRound,
  RotateCcw,
  ServerCrash,
  Unplug,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  HTTP_STATUS_COPY,
  type HttpStatusCode,
} from "@/lib/routing/http-status";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0, scale: 0.98, y: 14 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE_OUT },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.14 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

const line = {
  hidden: { scaleX: 0, opacity: 0 },
  show: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.9, ease: EASE_OUT },
  },
};

const iconShow = {
  hidden: { opacity: 0, scale: 0.84, rotate: -10 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 240,
      damping: 20,
      delay: 0.06,
    },
  },
};

const ICONS: Record<HttpStatusCode, LucideIcon> = {
  401: KeyRound,
  404: BookMarked,
  500: ServerCrash,
  502: Unplug,
  503: CloudOff,
};

type HttpStatusPanelProps = {
  code: HttpStatusCode;
  className?: string;
  /** Override primary CTA (e.g. login with ?next=) */
  primaryHref?: string;
  /** Optional retry for 500 / 502 / 503 */
  onRetry?: () => void;
  retryLabel?: string;
};

export function HttpStatusPanel({
  code,
  className,
  primaryHref,
  onRetry,
  retryLabel = "Skúsiť znova",
}: HttpStatusPanelProps) {
  const reduceMotion = useReducedMotion();
  const copy = HTTP_STATUS_COPY[code];
  const Icon = ICONS[code];
  const titleId = `http-status-${code}-title`;
  const accentRing =
    code === 401 || code === 404
      ? "border-accent/35 text-accent dark:border-mint/40 dark:text-mint"
      : "border-stair-2/40 text-stair-2 dark:border-stair-2/55";

  return (
    <motion.section
      className={cn(
        "relative isolate mx-auto w-full max-w-2xl overflow-hidden border border-rule bg-card/55 px-7 py-16 text-center shadow-[0_32px_80px_-48px_rgba(14,26,36,0.38)] sm:px-11 sm:py-[4.75rem] dark:border-white/12 dark:bg-surface-3/45 dark:shadow-[0_40px_100px_-60px_rgba(0,0,0,0.7)]",
        className,
      )}
      aria-labelledby={titleId}
      variants={reduceMotion ? undefined : container}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <p
          className={cn(
            "not-found-watermark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] font-display text-[clamp(6.5rem,28vw,11rem)] leading-none font-medium tracking-tighter text-ink/[0.04] select-none dark:text-white/[0.05]",
            !reduceMotion && "not-found-watermark-drift",
          )}
        >
          {code}
        </p>
        <div className="not-auth-ambient absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-b from-accent/35 via-mint/15 to-transparent blur-3xl" />
        <div className="not-auth-ambient-delayed absolute -right-20 bottom-4 h-44 w-44 rounded-full bg-gradient-to-tr from-sage/25 to-transparent blur-3xl dark:from-mint/12" />
        <div
          className="absolute inset-0 opacity-[0.32] dark:opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--rule) 55%, transparent) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-3 border border-rule/40 dark:border-white/[0.06]"
        aria-hidden
      />
      <span className="pointer-events-none absolute top-3 left-3 h-5 w-5 border-t-2 border-l-2 border-accent/70 dark:border-mint/50" />
      <span className="pointer-events-none absolute top-3 right-3 h-5 w-5 border-t-2 border-r-2 border-accent/45 dark:border-mint/35" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-accent/45 dark:border-mint/35" />
      <span className="pointer-events-none absolute right-3 bottom-3 h-5 w-5 border-r-2 border-b-2 border-accent/70 dark:border-mint/50" />

      <motion.div
        className="relative z-[1]"
        variants={reduceMotion ? undefined : stagger}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? undefined : "show"}
      >
        <motion.div
          className="mx-auto mb-7 flex justify-center"
          variants={reduceMotion ? undefined : iconShow}
        >
          <motion.div
            className={cn(
              "relative grid h-14 w-14 place-items-center rounded-full border bg-paper/85 dark:bg-surface-2/80",
              accentRing,
            )}
            animate={
              reduceMotion
                ? undefined
                : {
                    boxShadow: [
                      "0 0 0 0 rgba(77,115,86,0)",
                      "0 0 0 14px rgba(77,115,86,0)",
                      "0 0 0 0 rgba(77,115,86,0)",
                    ],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <Icon className="h-6 w-6 stroke-[1.5]" aria-hidden />
          </motion.div>
        </motion.div>

        <motion.p
          className="text-eyebrow font-mono text-[11px] font-semibold tracking-[0.28em] uppercase"
          variants={reduceMotion ? undefined : item}
        >
          {copy.eyebrow}
        </motion.p>

        <motion.h1
          id={titleId}
          className="mt-3 font-display text-[clamp(2rem,6vw,2.85rem)] leading-[1.02] tracking-tight text-ink"
          variants={reduceMotion ? undefined : item}
        >
          {copy.title}
        </motion.h1>

        <motion.p
          className="mx-auto mt-4 max-w-md text-balance text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
          variants={reduceMotion ? undefined : item}
        >
          {copy.description}
        </motion.p>

        <motion.div
          className="mx-auto mt-9 h-px max-w-xs origin-center bg-gradient-to-r from-transparent via-rule to-transparent dark:via-white/15"
          variants={reduceMotion ? undefined : line}
        />

        <motion.div
          className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          variants={reduceMotion ? undefined : item}
        >
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="split-cta group border border-ink bg-paper transition hover:-translate-y-0.5 dark:border-white/25 dark:bg-surface-2"
            >
              <span className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold tracking-wide text-ink">
                <RotateCcw className="size-4" strokeWidth={2} aria-hidden />
                {retryLabel}
              </span>
              <span className="flex items-center justify-center bg-ink px-4 text-paper transition group-hover:bg-accent group-hover:text-accent-foreground dark:bg-white dark:text-ink dark:group-hover:bg-mint dark:group-hover:text-ink">
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </span>
            </button>
          ) : null}

          {copy.actions.map((action) => {
            const href =
              action.primary && primaryHref ? primaryHref : action.href;
            const isPrimary = Boolean(action.primary) && !onRetry;

            if (isPrimary) {
              return (
                <Link
                  key={action.label}
                  href={href}
                  className="split-cta group border border-ink bg-paper transition hover:-translate-y-0.5 dark:border-white/25 dark:bg-surface-2"
                >
                  <span className="flex items-center px-6 py-3.5 text-sm font-semibold tracking-wide text-ink">
                    {action.label}
                  </span>
                  <span className="flex items-center justify-center bg-ink px-4 text-paper transition group-hover:bg-accent group-hover:text-accent-foreground dark:bg-white dark:text-ink dark:group-hover:bg-mint dark:group-hover:text-ink">
                    <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={action.label}
                href={href}
                className="group inline-flex items-center gap-2 border border-rule bg-transparent px-5 py-3.5 text-sm font-semibold tracking-wide text-ink transition hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent/5 dark:border-white/15 dark:hover:border-mint/40 dark:hover:bg-mint/5"
              >
                {action.label}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            );
          })}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

export function HttpStatusPageShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-14 sm:px-6 md:px-8 md:py-20">
      {children}
    </main>
  );
}

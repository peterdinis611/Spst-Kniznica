"use client";

import type { ReactNode } from "react";
import { KeyRound } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type NoticeTone = "sign-in" | "forbidden";

type NotAuthorizedNoticeProps = {
  eyebrow: string;
  title: string;
  description: string;
  /** Krátky text pod popisom — bez tlačidiel, len navigácia cez hlavičku. */
  hint?: string;
  className?: string;
  /** `page` — výrazný panel na celú sekciu; `compact` — dialóg / úzky kontext */
  variant?: "page" | "compact";
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0, scale: 0.98, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE_OUT },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.11, delayChildren: 0.12 },
  },
};

const line = {
  hidden: { scaleX: 0, opacity: 0 },
  show: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.85, ease: EASE_OUT },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

const iconPulse = {
  hidden: { opacity: 0, scale: 0.82, rotate: -8 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 22,
      delay: 0.05,
    },
  },
};

function NotAuthorizedFrame({
  tone,
  variant,
  titleId,
  className,
  children,
}: {
  tone: NoticeTone;
  variant: "page" | "compact";
  titleId: string;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const isPage = variant === "page";
  const accentClass =
    tone === "forbidden"
      ? "from-stair-2/25 via-stair-3/10 to-transparent"
      : "from-accent/30 via-mint/15 to-transparent";

  return (
    <motion.section
      className={cn(
        "relative isolate overflow-hidden text-center",
        isPage
          ? "mx-auto w-full max-w-xl border border-rule bg-card/55 px-7 py-16 shadow-[0_32px_80px_-48px_rgba(14,26,36,0.35)] sm:px-10 sm:py-[4.5rem] dark:border-white/12 dark:bg-surface-3/45 dark:shadow-[0_40px_100px_-60px_rgba(0,0,0,0.65)]"
          : "max-w-lg border border-rule/80 bg-card/40 px-5 py-8 dark:border-white/10 dark:bg-surface-3/30",
        className,
      )}
      aria-labelledby={titleId}
      variants={reduceMotion ? undefined : container}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-40"
        aria-hidden
      >
        <div
          className={cn(
            "not-auth-ambient absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-gradient-to-b blur-3xl",
            accentClass,
          )}
        />
        <div className="not-auth-ambient-delayed absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-gradient-to-tr from-sage/20 to-transparent blur-3xl dark:from-mint/10" />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
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

      <span
        className="pointer-events-none absolute top-3 left-3 h-5 w-5 border-t-2 border-l-2 border-accent/70 dark:border-mint/50"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute top-3 right-3 h-5 w-5 border-t-2 border-r-2 border-accent/50 dark:border-mint/40"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-accent/50 dark:border-mint/40"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-3 bottom-3 h-5 w-5 border-r-2 border-b-2 border-accent/70 dark:border-mint/50"
        aria-hidden
      />

      <motion.div
        className="relative z-[1]"
        variants={reduceMotion ? undefined : stagger}
        initial={reduceMotion ? false : "hidden"}
        animate={reduceMotion ? undefined : "show"}
      >
        {children}
      </motion.div>
    </motion.section>
  );
}

function NoticeIcon({
  tone,
  variant,
}: {
  tone: NoticeTone;
  variant: "page" | "compact";
}) {
  const reduceMotion = useReducedMotion();
  const size = variant === "page" ? "h-14 w-14" : "h-11 w-11";
  const ring =
    tone === "forbidden"
      ? "border-stair-2/40 text-stair-2 dark:border-stair-2/50"
      : "border-accent/35 text-accent dark:border-mint/40 dark:text-mint";

  return (
    <motion.div
      className="mx-auto mb-6 flex justify-center"
      variants={reduceMotion ? undefined : iconPulse}
    >
      <motion.div
        className={cn(
          "relative grid place-items-center rounded-full border bg-paper/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] dark:bg-surface-2/80",
          size,
          ring,
        )}
        animate={
          reduceMotion
            ? undefined
            : {
                boxShadow: [
                  "inset 0 0 0 1px rgba(255,255,255,0.35), 0 0 0 0 rgba(77,115,86,0)",
                  "inset 0 0 0 1px rgba(255,255,255,0.35), 0 0 0 12px rgba(77,115,86,0)",
                  "inset 0 0 0 1px rgba(255,255,255,0.35), 0 0 0 0 rgba(77,115,86,0)",
                ],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <KeyRound
          className={cn(
            variant === "page" ? "h-6 w-6" : "h-5 w-5",
            "stroke-[1.5]",
          )}
          aria-hidden
        />
      </motion.div>
    </motion.div>
  );
}

function NoticeContent({
  tone,
  variant,
  titleId,
  eyebrow,
  title,
  description,
  hint,
}: NotAuthorizedNoticeProps & {
  tone: NoticeTone;
  titleId: string;
  variant: "page" | "compact";
}) {
  const reduceMotion = useReducedMotion();
  const compact = variant === "compact";

  return (
  <>
      {!compact ? <NoticeIcon tone={tone} variant={variant} /> : null}

      <motion.p
        className={cn(
          "text-eyebrow font-mono text-[11px] font-semibold tracking-[0.26em] uppercase",
          compact && "text-left",
        )}
        variants={reduceMotion ? undefined : item}
      >
        {eyebrow}
      </motion.p>

      <motion.h1
        id={titleId}
        className={cn(
          "mt-3 font-display tracking-tight text-ink",
          compact
            ? "text-left text-[clamp(1.35rem,4vw,1.75rem)]"
            : "text-3xl sm:text-[2.35rem] sm:leading-[1.05]",
        )}
        variants={reduceMotion ? undefined : item}
      >
        {title}
      </motion.h1>

      <motion.p
        className={cn(
          "mt-4 text-sm leading-relaxed text-muted-foreground sm:text-[15px]",
          compact ? "max-w-md text-left" : "mx-auto max-w-md text-balance",
        )}
        variants={reduceMotion ? undefined : item}
      >
        {description}
      </motion.p>

      {hint ? (
        <>
          <motion.div
            className={cn(
              "mx-auto mt-8 h-px max-w-xs origin-center bg-gradient-to-r from-transparent via-rule to-transparent dark:via-white/15",
              compact && "mx-0 max-w-none origin-left",
            )}
            variants={reduceMotion ? undefined : line}
          />
          <motion.p
            className={cn(
              "mt-5 text-xs leading-relaxed text-muted-foreground/90",
              compact && "text-left",
            )}
            variants={reduceMotion ? undefined : item}
          >
            <span className="text-accent/90 dark:text-mint/90">→ </span>
            {hint}
          </motion.p>
        </>
      ) : null}
    </>
  );
}

export function SignInRequiredNotice({
  eyebrow,
  title,
  description,
  hint = "Prihlás sa cez položku „Prihlásiť“ v hornej lište.",
  className,
  variant = "page",
}: NotAuthorizedNoticeProps) {
  const titleId = "sign-in-required-title";
  const compact = variant === "compact";

  return (
    <NotAuthorizedFrame
      tone="sign-in"
      variant={variant}
      titleId={titleId}
      className={cn(compact && "text-left", className)}
    >
      <NoticeContent
        tone="sign-in"
        variant={variant}
        titleId={titleId}
        eyebrow={eyebrow}
        title={title}
        description={description}
        hint={hint}
      />
    </NotAuthorizedFrame>
  );
}

type ForbiddenNoticeProps = {
  eyebrow: string;
  title: string;
  description: string;
  hint?: string;
  className?: string;
  variant?: "page" | "compact";
};

export function ForbiddenNotice({
  eyebrow,
  title,
  description,
  hint,
  className,
  variant = "page",
}: ForbiddenNoticeProps) {
  const titleId = "forbidden-title";

  return (
    <NotAuthorizedFrame
      tone="forbidden"
      variant={variant}
      titleId={titleId}
      className={className}
    >
      <NoticeContent
        tone="forbidden"
        variant={variant}
        titleId={titleId}
        eyebrow={eyebrow}
        title={title}
        description={description}
        hint={hint}
      />
    </NotAuthorizedFrame>
  );
}

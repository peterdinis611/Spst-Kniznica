"use client";

import { useCallback, useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Library, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  isTurnstileConfigured,
  TurnstileWidget,
} from "@/components/security/TurnstileWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveUserDisplayName } from "@/lib/auth/display-name";
import { cn } from "@/lib/utils";

function initials(name: string, email?: string | null): string {
  const source = name.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function nameLines(fullName: string): { first: string; rest: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Čitateľ", rest: "" };
  if (parts.length === 1) return { first: parts[0]!, rest: "" };
  return { first: parts[0]!, rest: parts.slice(1).join(" ") };
}

function roleLabel(roles: string[]): string {
  if (roles.length === 0) return "Čitateľ";
  if (roles.some((r) => r.toLowerCase() === "admin")) return "Administrátor";
  if (roles.some((r) => r.toLowerCase() === "librarian")) return "Knižník";
  return roles[0] ?? "Čitateľ";
}

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

const unlocks = [
  {
    n: "01",
    title: "Rezervácia",
    body: "Titul podržíš, kým ho knižník vydá na pulte.",
  },
  {
    n: "02",
    title: "Výpožičný lístok",
    body: "Meno a email sa doplnia z tvojho účtu.",
  },
  {
    n: "03",
    title: "Termín vrátenia",
    body: "Vo výpožičkách vidíš, dokedy knihu vrátiť.",
  },
] as const;

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, entraEnabled, user, account, login, logout, error, config } =
    useAuth();
  const loginNotice = config?.loginNotice?.trim();
  const turnstileRequired = isTurnstileConfigured();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onTurnstile = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  useEffect(() => {
    if (!ready || !user?.isAuthenticated) return;
    const next = safeNextPath(searchParams.get("next"));
    if (next) {
      router.replace(next);
    }
  }, [ready, user?.isAuthenticated, searchParams, router]);

  if (!ready) {
    return <LoginPanelSkeleton />;
  }

  if (user?.isAuthenticated) {
    const fullName = resolveUserDisplayName(user, account);
    const mono = initials(fullName, user.email);
    const { first, rest } = nameLines(fullName);
    const primaryRole = roleLabel(user.roles);
    const wantsAdmin = safeNextPath(searchParams.get("next")) === "/admin";

    return (
      <section aria-labelledby="login-panel-heading" className="reveal">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="relative lg:col-span-7">
            <p
              aria-hidden
              className="pointer-events-none absolute -top-8 -left-1 font-display text-[7.5rem] leading-none tracking-tight text-ink/[0.045] select-none sm:text-[9rem] dark:text-white/[0.05]"
            >
              {mono}
            </p>

            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-sage uppercase">
                  Čitateľský preukaz
                </p>
                <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-sage uppercase">
                  <span className="size-1.5 rounded-full bg-sage" aria-hidden />
                  Prihlásený
                </p>
              </div>

              <h1
                id="login-panel-heading"
                className="mt-6 font-display text-[clamp(3.6rem,8.5vw,6.75rem)] leading-[0.84] font-medium tracking-[-0.035em] text-ink"
              >
                <span className="block">{first}</span>
                {rest ? (
                  <span className="mt-1 block text-sage">{rest}</span>
                ) : null}
              </h1>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-rule pt-5">
                <p className="min-w-0 text-sm break-all text-muted-foreground">
                  {user.email ?? "bez emailu"}
                </p>
                <span className="inline-flex -rotate-2 border border-sage px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-sage uppercase">
                  <span className="sr-only">Rola: </span>
                  {primaryRole}
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-ink underline decoration-rule underline-offset-4 transition hover:decoration-ink"
                >
                  Odhlásiť sa
                  <LogOut
                    className="size-3.5 transition group-hover:translate-x-0.5"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                </button>
              </div>

              {wantsAdmin && !user.isStaff ? (
                <p className="mt-5 max-w-md border-l-2 border-stair-1 pl-3 text-sm leading-relaxed text-ink">
                  Účet ešte nemá rolu administrátora alebo knižníka. Lokálne môžeš
                  dočasne zapnúť{" "}
                  <code className="font-mono text-xs">GrantStaffInDevelopment</code>{" "}
                  (opt-in) a odhlásiť → prihlásiť, alebo v Azure priraď App role{" "}
                  <strong>Admin</strong>.
                </p>
              ) : null}
            </div>
          </div>

          <nav
            className="relative flex flex-col gap-4 lg:col-span-5 lg:pt-8 lg:before:absolute lg:before:top-6 lg:before:bottom-2 lg:before:-left-3 lg:before:w-px lg:before:bg-[repeating-linear-gradient(to_bottom,var(--rule)_0_6px,transparent_6px_12px)]"
            aria-label="Skratky účtu"
          >
            <Destination
              href="/books"
              kicker="01 — Fond"
              label="Katalóg kníh"
              hint="Tituly, autori a koľko exemplárov je voľných."
              icon={BookOpen}
              tone="solid"
              className="lg:ml-6"
            />
            <Destination
              href="/library"
              kicker="02 — Účet"
              label="Moje výpožičky"
              hint="Lístky, termíny a vrátenie."
              icon={Library}
              className="lg:mr-8"
            />
            <Destination
              href="/admin"
              kicker={user.isStaff ? "03 — Personál" : "03 — Uzamknuté"}
              label="Správcovský pult"
              hint={
                user.isStaff
                  ? "Výdaj, vrátenie a evidencia fondu."
                  : "Vyžaduje personál."
              }
              icon={Shield}
              tone={user.isStaff ? "line" : "quiet"}
              className="lg:ml-10"
            />
          </nav>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="login-panel-heading" className="reveal">
      <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-sage uppercase">
            {entraEnabled ? "Školský účet" : "Vývojové prostredie"}
          </p>
          <h1
            id="login-panel-heading"
            className="mt-5 max-w-[12ch] font-display text-[clamp(3.4rem,8vw,6.2rem)] leading-[0.86] font-medium tracking-[-0.035em] text-ink"
          >
            {entraEnabled ? "Prihlás sa" : "Vývojový režim"}
            <span className="text-sage">.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
            {entraEnabled
              ? "Microsoft účet školy odomkne rezerváciu. Meno na výpožičnom lístku sa vezme odtiaľ."
              : "Lokálny administrátor pre vývoj bez Entra. V produkcii sa prihlasuje školským účtom."}
          </p>

          {loginNotice ? (
            <p
              className="mt-6 max-w-md border-l-2 border-sage pl-3 text-sm leading-relaxed text-ink"
              role="status"
            >
              {loginNotice}
            </p>
          ) : null}

          {error ? (
            <p
              className="mt-6 max-w-md border-l-2 border-red-600 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-red-800 dark:border-red-400 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <TurnstileWidget onToken={onTurnstile} />

          <button
            type="button"
            className="split-cta group mt-8 w-full max-w-md border border-ink bg-paper transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
            disabled={turnstileRequired && !turnstileToken}
            onClick={() => void login()}
          >
            <span className="flex items-center px-5 py-3.5 text-sm font-semibold tracking-wide text-ink">
              {entraEnabled
                ? "Prihlásiť cez Entra"
                : "Pokračovať ako vývojový administrátor"}
            </span>
            <span className="flex items-center justify-center bg-ink px-4 text-paper transition group-hover:bg-accent group-hover:text-accent-foreground">
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </span>
          </button>

          <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Nemáš účet? Požiadaj správcu školy o prístup v Entra.
          </p>
        </div>

        <aside
          className="relative lg:col-span-5 lg:pt-4 lg:before:absolute lg:before:top-2 lg:before:bottom-2 lg:before:-left-4 lg:before:w-px lg:before:bg-[repeating-linear-gradient(to_bottom,var(--rule)_0_6px,transparent_6px_12px)]"
          aria-label="Čo účet odomkne"
        >
          <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-sage uppercase">
            Čo účet odomkne
          </p>
          <ol className="mt-6">
            {unlocks.map((item) => (
              <li
                key={item.n}
                className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 border-t border-rule py-5 last:border-b"
              >
                <span className="font-display text-3xl leading-none text-ink/20 tabular-nums">
                  {item.n}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block font-display text-2xl leading-none tracking-tight text-ink">
                    {item.title}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}

export function LoginPanelSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid items-start gap-12 lg:grid-cols-12 lg:gap-8"
    >
      <span className="sr-only">Načítavam účet…</span>
      <div className="space-y-6 lg:col-span-7" aria-hidden>
        <Skeleton className="h-3 w-40 rounded-none" />
        <Skeleton className="h-24 w-full max-w-md rounded-none" />
        <Skeleton className="h-16 w-2/3 rounded-none" />
        <Skeleton className="h-4 w-56 rounded-none" />
      </div>
      <div className="space-y-4 lg:col-span-5 lg:pt-8" aria-hidden>
        <Skeleton className="h-28 w-full rounded-none" />
        <Skeleton className="h-24 w-[92%] rounded-none" />
        <Skeleton className="ml-auto h-20 w-[84%] rounded-none" />
      </div>
    </div>
  );
}

function Destination({
  href,
  kicker,
  label,
  hint,
  icon: Icon,
  tone = "line",
  className,
}: {
  href: string;
  kicker: string;
  label: string;
  hint: string;
  icon: typeof BookOpen;
  tone?: "solid" | "line" | "quiet";
  className?: string;
}) {
  const solid = tone === "solid";
  const quiet = tone === "quiet";

  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "group relative block px-5 py-5 transition duration-300 hover:-translate-y-0.5 sm:px-6 sm:py-6",
        solid
          ? "bg-ink text-paper"
          : quiet
            ? "border border-dashed border-rule bg-paper-deep/50 text-ink hover:border-sage"
            : "border border-rule bg-paper-deep/70 text-ink hover:border-sage",
        className,
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "font-mono text-[10px] tracking-[0.18em] uppercase",
            solid ? "text-paper/70" : "text-sage",
          )}
        >
          {kicker}
        </span>
        <Icon
          className={cn(
            "size-4 shrink-0",
            solid ? "text-paper/80" : "text-sage",
          )}
          strokeWidth={1.7}
          aria-hidden
        />
      </span>
      <span className="mt-4 flex items-end justify-between gap-4">
        <span className="min-w-0">
          <span className="block font-display text-[1.85rem] leading-none tracking-tight sm:text-[2.1rem]">
            {label}
          </span>
          <span
            className={cn(
              "mt-2 block text-sm leading-relaxed",
              solid
                ? "text-paper/75 group-hover:text-ink/75"
                : "text-muted-foreground",
            )}
          >
            {hint}
          </span>
        </span>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center transition group-hover:translate-x-0.5",
            solid
              ? "bg-paper text-ink"
              : "border border-rule text-ink group-hover:border-ink group-hover:bg-ink group-hover:text-paper",
          )}
        >
          <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
        </span>
      </span>
      <DestinationPending solid={solid} />
    </Link>
  );
}

function DestinationPending({ solid }: { solid: boolean }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className={cn(
        "mt-3 block font-mono text-[10px] tracking-[0.16em] uppercase",
        solid ? "text-paper/70" : "text-muted-foreground",
      )}
      aria-live="polite"
    >
      Otváram…
    </span>
  );
}

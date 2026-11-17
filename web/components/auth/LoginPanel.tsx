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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    return (
      <PanelShell>
        <LoadingState />
      </PanelShell>
    );
  }

  if (user?.isAuthenticated) {
    const fullName = resolveUserDisplayName(user, account);
    const mono = initials(fullName, user.email);
    const primaryRole = roleLabel(user.roles);
    const wantsAdmin = safeNextPath(searchParams.get("next")) === "/admin";

    return (
      <PanelShell>
        <div className="flex items-start justify-between gap-4">
          <div
            className="grid size-14 place-items-center border border-sage/30 bg-mint/70 font-display text-lg tracking-tight text-sage dark:border-sage/45 dark:bg-accent/15 dark:text-ink"
            aria-hidden
          >
            {mono}
          </div>
          <span className="inline-flex items-center gap-1.5 pt-1 font-mono text-[10px] tracking-[0.16em] text-sage uppercase">
            <span className="size-1.5 rounded-full bg-sage" aria-hidden />
            prihlásený
          </span>
        </div>

        <h2
          id="login-panel-heading"
          className="mt-5 font-display text-[1.75rem] leading-none tracking-tight text-ink"
        >
          {fullName}
        </h2>
        <p className="mt-2 break-all text-sm text-muted-foreground">
          {user.email ?? "bez emailu"}
        </p>

        <RoleBadges primaryRole={primaryRole} roles={user.roles} />

        {wantsAdmin && !user.isStaff ? (
          <p className="mt-5 border border-stair-1/35 bg-stair-1/10 px-3 py-2.5 text-sm leading-relaxed text-ink">
            Účet ešte nemá rolu administrátora alebo knižníka. Lokálne môžeš
            dočasne zapnúť{" "}
            <code className="font-mono text-xs">GrantStaffInDevelopment</code>{" "}
            (opt-in) a odhlásiť → prihlásiť, alebo v Azure priraď App role{" "}
            <strong>Admin</strong>.
          </p>
        ) : null}

        <nav
          className="mt-6 border-t border-rule pt-2 dark:border-white/10"
          aria-label="Skratky účtu"
        >
          <QuickLink href="/books" icon={BookOpen} label="Katalóg kníh" />
          <QuickLink href="/library" icon={Library} label="Moje výpožičky" />
          {user.isStaff ? (
            <QuickLink href="/admin" icon={Shield} label="Správcovský pult" />
          ) : (
            <QuickLink
              href="/admin"
              icon={Shield}
              label="Správcovský pult"
              hint="vyžaduje personál"
            />
          )}
        </nav>

        <Button
          variant="outline"
          className="mt-5 h-11 w-full rounded-none border-rule bg-transparent text-ink hover:border-sage/40 hover:bg-mint/25 dark:border-white/15 dark:hover:bg-white/5"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" strokeWidth={1.8} aria-hidden />
          Odhlásiť sa
        </Button>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <p className="font-mono text-[10px] tracking-[0.2em] text-eyebrow uppercase">
        {entraEnabled ? "Microsoft Entra" : "Vývojové prostredie"}
      </p>
      <h2
        id="login-panel-heading"
        className="mt-3 font-display text-[1.75rem] leading-none tracking-tight text-ink"
      >
        {entraEnabled ? "Prihlás sa" : "Vývojový režim"}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {entraEnabled
          ? "Školský Microsoft účet ti odomkne rezerváciu kníh."
          : "Lokálny administrátor pre vývoj bez Entra."}
      </p>

      {loginNotice ? (
        <p
          className="mt-5 border border-sage/30 bg-mint/35 px-3 py-2.5 text-sm text-ink dark:border-accent/40 dark:bg-accent/10"
          role="status"
        >
          {loginNotice}
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-5 whitespace-pre-wrap border border-red-500/35 bg-red-500/10 px-3 py-2.5 text-sm text-red-800 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <TurnstileWidget onToken={onTurnstile} />

      <Button
        className="mt-6 h-12 w-full rounded-none bg-ink text-paper hover:bg-ink/90 dark:bg-sage dark:text-ink dark:hover:bg-sage/90"
        disabled={turnstileRequired && !turnstileToken}
        onClick={() => void login()}
      >
        {entraEnabled
          ? "Prihlásiť cez Entra"
          : "Pokračovať ako vývojový administrátor"}
        <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
      </Button>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        Nemáš účet? Požiadaj správcu školy o prístup v Entra.
      </p>
    </PanelShell>
  );
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="Prihlásenie"
      className={cn(
        "relative overflow-hidden border border-rule/90 bg-card/95 p-6 sm:p-7",
        "shadow-[0_22px_50px_-34px_rgba(14,26,36,0.45)]",
        "dark:border-white/12 dark:bg-paper-deep/55 dark:shadow-none",
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sage via-mint to-accent-deep"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -bottom-10 size-36 rounded-full bg-mint/30 blur-2xl dark:bg-sage/10"
      />
      <div className="relative">{children}</div>
    </section>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
      <span className="sr-only">Načítavam účet…</span>
      <div className="flex justify-between" aria-hidden>
        <Skeleton className="size-14" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-48" aria-hidden />
      <Skeleton className="h-4 w-56" aria-hidden />
      <Skeleton className="h-6 w-24" aria-hidden />
      <div className="space-y-1 border-t border-rule pt-3 dark:border-white/10" aria-hidden>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-11 w-full" aria-hidden />
    </div>
  );
}

function RoleBadges({
  primaryRole,
  roles,
}: {
  primaryRole: string;
  roles: string[];
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2" aria-label="Role účtu">
      <Badge className="rounded-none border border-sage/25 bg-mint/85 px-2.5 text-xs text-sage dark:border-transparent dark:bg-accent dark:text-accent-foreground">
        {primaryRole}
      </Badge>
      {roles.map((role) => (
        <Badge
          key={role}
          variant="outline"
          className="rounded-none border-rule text-xs dark:border-white/15"
        >
          {role}
        </Badge>
      ))}
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: typeof BookOpen;
  label: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "group flex items-center justify-between gap-3 border-b border-rule/70 py-3.5 text-sm text-ink last:border-b-0",
        "transition hover:bg-mint/20 dark:border-white/10 dark:hover:bg-white/[0.03]",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center border border-sage/25 bg-mint/40 text-sage transition group-hover:border-sage/50 group-hover:bg-sage group-hover:text-paper dark:border-sage/40 dark:bg-transparent dark:group-hover:bg-sage dark:group-hover:text-ink">
          <Icon className="size-3.5" strokeWidth={1.7} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{label}</span>
          {hint ? (
            <span className="block truncate text-xs text-muted-foreground">
              {hint}
            </span>
          ) : null}
        </span>
        <QuickLinkPending />
      </span>
      <ArrowRight
        className="size-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-ink"
        aria-hidden
      />
    </Link>
  );
}

function QuickLinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
      aria-live="polite"
    >
      …
    </span>
  );
}

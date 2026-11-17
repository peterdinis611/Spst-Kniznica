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
      <PanelShell accentBar>
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex size-12 items-center justify-center border border-sage/25 bg-mint/60 font-display text-base text-sage dark:border-accent/50 dark:bg-accent/15 dark:text-ink"
            aria-hidden
          >
            {mono}
          </div>
          <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            ● prihlásený
          </span>
        </div>

        <h2
          id="login-panel-heading"
          className="mt-6 font-display text-2xl tracking-tight text-ink"
        >
          {fullName}
        </h2>
        <p className="mt-1 break-all text-sm text-muted-foreground">
          {user.email ?? "bez emailu"}
        </p>

        <RoleBadges primaryRole={primaryRole} roles={user.roles} />

        {wantsAdmin && !user.isStaff ? (
          <p className="mt-4 border border-stair-1/35 bg-stair-1/10 px-3 py-2 text-sm text-ink">
            Účet ešte nemá rolu administrátora alebo knižníka. Lokálne môžeš
            dočasne zapnúť{" "}
            <code className="font-mono text-xs">GrantStaffInDevelopment</code>{" "}
            (opt-in) a odhlásiť → prihlásiť, alebo v Azure priraď App role{" "}
            <strong>Admin</strong>.
          </p>
        ) : null}

        <nav className="mt-6 grid gap-1.5" aria-label="Skratky účtu">
          <QuickLink href="/books" icon={BookOpen} label="Katalóg kníh" />
          <QuickLink href="/library" icon={Library} label="Moje výpožičky" />
          {user.isStaff ? (
            <QuickLink href="/admin" icon={Shield} label="Správcovský pult" />
          ) : (
            <QuickLink
              href="/admin"
              icon={Shield}
              label="Správcovský pult (vyžaduje personál)"
            />
          )}
        </nav>

        <Button
          variant="outline"
          className="mt-6 h-10 w-full rounded-none border-rule bg-paper/50 text-ink hover:bg-mint/30 dark:bg-transparent"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" strokeWidth={1.8} aria-hidden />
          Odhlásiť sa
        </Button>
      </PanelShell>
    );
  }

  return (
    <PanelShell accentBar>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        {entraEnabled ? "Microsoft Entra" : "Vývojové prostredie"}
      </p>
      <h2
        id="login-panel-heading"
        className="mt-2 font-display text-2xl tracking-tight text-ink"
      >
        {entraEnabled ? "Prihlás sa" : "Vývojový režim"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {entraEnabled
          ? "Účet Microsoft ti odomkne rezerváciu kníh."
          : "Lokálny administrátor pre vývoj."}
      </p>

      {loginNotice ? (
        <p
          className="mt-4 border border-sage/30 bg-mint/35 px-3 py-2 text-sm text-ink dark:border-accent/40 dark:bg-accent/10"
          role="status"
        >
          {loginNotice}
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-4 whitespace-pre-wrap border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <TurnstileWidget onToken={onTurnstile} />

      <Button
        className="mt-6 h-11 w-full rounded-none bg-accent text-accent-foreground hover:bg-accent-deep"
        disabled={turnstileRequired && !turnstileToken}
        onClick={() => void login()}
      >
        {entraEnabled
          ? "Prihlásiť cez Entra"
          : "Pokračovať ako vývojový administrátor"}
        <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Nemáš účet? Požiadaj správcu školy o prístup v Entra.
      </p>
    </PanelShell>
  );
}

function PanelShell({
  children,
  accentBar,
}: {
  children: React.ReactNode;
  accentBar?: boolean;
}) {
  return (
    <section
      aria-label="Prihlásenie"
      className="relative border border-rule/90 bg-card/90 p-6 shadow-[0_18px_40px_-28px_rgba(14,26,36,0.35)] backdrop-blur-[2px] sm:p-7 dark:border-white/10 dark:bg-paper-deep/50 dark:shadow-none"
    >
      {accentBar ? (
        <div
          aria-hidden
          className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-sage via-mint to-accent-deep dark:from-sage dark:via-accent dark:to-accent-deep"
        />
      ) : null}
      <div className={accentBar ? "pl-2" : undefined}>{children}</div>
    </section>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
      <span className="sr-only">Načítavam účet…</span>
      <div className="flex justify-between" aria-hidden>
        <Skeleton className="size-12" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-48" aria-hidden />
      <Skeleton className="h-4 w-56" aria-hidden />
      <Skeleton className="h-6 w-24" aria-hidden />
      <div className="space-y-2 pt-2" aria-hidden>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" aria-hidden />
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
      <Badge className="rounded-none border border-sage/20 bg-mint/80 px-2.5 text-xs text-sage dark:border-transparent dark:bg-accent dark:text-accent-foreground">
        {primaryRole}
      </Badge>
      {roles.map((role) => (
        <Badge
          key={role}
          variant="outline"
          className="rounded-none border-rule text-xs"
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
}: {
  href: string;
  icon: typeof BookOpen;
  label: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "group flex items-center justify-between gap-2 border border-transparent px-2 py-2 text-sm text-ink transition",
        "hover:border-rule hover:bg-accent-soft/40 dark:hover:border-white/10 dark:hover:bg-paper/80",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon
          className="size-4 text-sage dark:text-accent"
          strokeWidth={1.6}
          aria-hidden
        />
        {label}
        <QuickLinkPending />
      </span>
      <ArrowRight
        className="size-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-ink"
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

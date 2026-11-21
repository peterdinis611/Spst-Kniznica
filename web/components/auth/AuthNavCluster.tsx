"use client";

import Link from "next/link";
import { LogIn } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { resolveUserDisplayName } from "@/lib/auth/display-name";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (parts[0] ?? "?").slice(0, 2).toUpperCase();
}

export function AuthNavCluster() {
  const { ready, user, account } = useAuth();
  const displayName = resolveUserDisplayName(user, account);

  if (!ready) {
    return (
      <span data-tour="auth" className="inline-flex items-center">
        <Button
          size="icon"
          variant="outline"
          className="size-10 animate-pulse rounded-full border-rule sm:hidden dark:border-white/25"
          disabled
          aria-label="Načítavam účet"
        />
        <Button
          size="sm"
          className="hidden h-10 rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent-deep sm:inline-flex"
          disabled
        >
          …
        </Button>
      </span>
    );
  }

  if (user?.isAuthenticated) {
    const initials = initialsFrom(displayName || user.email || "?");

    return (
      <span data-tour="auth" className="inline-flex items-center gap-1.5 sm:gap-2">
        {user.isStaff ? (
          <Button
            size="sm"
            variant="outline"
            className="hidden h-10 rounded-full border-rule px-4 sm:inline-flex dark:border-white/25"
            render={<Link href="/admin" />}
          >
            Správa
          </Button>
        ) : null}
        <Button
          size="sm"
          className="hidden h-10 max-w-[min(100%,13.5rem)] rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent-deep sm:inline-flex"
          render={<Link href="/login" />}
          title={displayName}
        >
          <span className="truncate">{displayName}</span>
        </Button>
        <Button
          size="icon"
          className="size-10 rounded-full bg-accent text-[0.7rem] font-semibold tracking-wide text-accent-foreground hover:bg-accent-deep sm:hidden"
          aria-label={`Účet: ${displayName || "prihlásený"}`}
          title={displayName}
          render={<Link href="/login" />}
        >
          <span aria-hidden>{initials}</span>
        </Button>
      </span>
    );
  }

  return (
    <span data-tour="auth" className="inline-flex items-center gap-1.5 sm:gap-2">
      <Button
        size="sm"
        className="hidden h-10 rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent-deep sm:inline-flex"
        render={<Link href="/login" />}
      >
        <LogIn className="size-3.5" strokeWidth={1.8} aria-hidden />
        Prihlásiť
      </Button>
      <Button
        size="icon"
        variant="outline"
        className="size-10 rounded-full border-rule sm:hidden dark:border-white/25 dark:text-white"
        aria-label="Prihlásiť sa"
        render={<Link href="/login" />}
      >
        <LogIn className="size-4" strokeWidth={1.8} aria-hidden />
      </Button>
    </span>
  );
}

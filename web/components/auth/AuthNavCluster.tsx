"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { resolveUserDisplayName } from "@/lib/auth/display-name";

export function AuthNavCluster() {
  const { ready, user, account } = useAuth();
  const displayName = resolveUserDisplayName(user, account);

  if (!ready) {
    return (
      <Button
        size="sm"
        className="hidden h-10 rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent-deep sm:inline-flex"
        disabled
      >
        …
      </Button>
    );
  }

  if (user?.isAuthenticated) {
    return (
      <>
        {user.isStaff ? (
          <Button
            size="sm"
            variant="outline"
            className="hidden h-10 rounded-full border-rule px-4 sm:inline-flex dark:border-white/25"
            render={<Link href="/admin" />}
          >
            Admin
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
          variant="outline"
          className="size-10 rounded-full border-rule sm:hidden dark:border-white/25 dark:text-white"
          aria-label="Účet"
          render={<Link href="/login" />}
        >
          <LogIn className="size-4" strokeWidth={1.8} />
        </Button>
      </>
    );
  }

  return (
    <>
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
        <LogIn className="size-4" strokeWidth={1.8} />
      </Button>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";

export function LoginPanel() {
  const router = useRouter();
  const { ready, entraEnabled, user, login, logout, error } = useAuth();

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground">Načítavam autentifikáciu…</p>
    );
  }

  if (user?.isAuthenticated) {
    return (
      <div className="space-y-5 border border-rule bg-paper-deep/40 p-5 sm:p-6 dark:border-white/10">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Prihlásený
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight text-ink">
            {user.name}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.email ?? "bez emailu"} · {user.roles.join(", ") || "bez rolí"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {user.isStaff ? (
            <Button
              className="h-11 rounded-none bg-accent text-black hover:bg-accent-deep"
              onClick={() => router.push("/admin")}
            >
              Admin pult
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="h-11 rounded-none border-ink"
            onClick={() => void logout()}
          >
            Odhlásiť
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 border border-rule bg-paper-deep/40 p-5 sm:p-6 dark:border-white/10">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          {entraEnabled ? "Microsoft Entra ID" : "Development auth"}
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-ink">
          {entraEnabled ? "Prihlásenie cez Entra" : "Lokálny admin režim"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {entraEnabled
            ? "Prihlás sa firemným účtom. Token pôjde na AuthService/AdminService cez gateway."
            : "Entra je vypnutá (Entra:Enabled=false). Backend používa Development principal s rolou Admin."}
        </p>
      </div>

      {error ? (
        <p className="whitespace-pre-wrap border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm leading-relaxed text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <Button
        className="h-11 w-full rounded-none bg-accent text-black hover:bg-accent-deep"
        onClick={() => void login()}
      >
        {entraEnabled ? "Prihlásiť cez Entra" : "Pokračovať ako Dev Admin"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Späť na{" "}
        <Link
          href="/"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          landing
        </Link>
      </p>
    </div>
  );
}

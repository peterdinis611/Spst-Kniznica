"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchAdminDashboard } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

type Dashboard = Awaited<ReturnType<typeof fetchAdminDashboard>>;

export function AdminDashboard() {
  const { ready, user, getAccessToken, login, entraEnabled } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !user?.isStaff) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessToken();
        const dashboard = await fetchAdminDashboard(token);
        if (!cancelled) setData(dashboard);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Načítanie zlyhalo");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user, getAccessToken]);

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Načítavam…</p>;
  }

  if (!user?.isAuthenticated) {
    return (
      <div className="max-w-lg space-y-4">
        <p className="text-sm text-muted-foreground">
          Admin pult vyžaduje prihlásenie
          {entraEnabled ? " cez Entra" : " (dev auth)"}.
        </p>
        <Button
          className="rounded-none bg-accent text-accent-foreground hover:bg-accent-deep"
          onClick={() => void login()}
        >
          Prihlásiť sa
        </Button>
      </div>
    );
  }

  if (!user.isStaff) {
    return (
      <p className="text-sm text-muted-foreground">
        Účet {user.email ?? user.name} nemá rolu Librarian/Admin.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            AdminService
          </p>
          <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.4rem)] tracking-tight text-ink">
            Prevádzkový pult
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.name}
            {data ? ` · ${data.healthyCount} healthy / ${data.unhealthyCount} down` : null}
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-none border-ink"
          render={<Link href="/login" />}
        >
          Účet
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Kontrolujem služby…</p>
      ) : null}
      {error ? (
        <p className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {data ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.services.map((service) => (
            <li
              key={service.name}
              className="border border-rule px-4 py-4 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-xl text-ink">{service.name}</p>
                <span
                  className={
                    service.healthy
                      ? "text-xs tracking-[0.14em] text-emerald-700 uppercase dark:text-emerald-300"
                      : "text-xs tracking-[0.14em] text-red-700 uppercase dark:text-red-300"
                  }
                >
                  {service.status}
                </span>
              </div>
              <p className="mt-2 truncate text-xs text-muted-foreground">
                {service.url}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { adminHttp } from "@/lib/admin/http";
import { fetchAuthMe } from "@/lib/auth/client";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type WhoAmI = {
  id?: string;
  name?: string;
  email?: string;
  roles?: string[];
};

type AuthMe = Awaited<ReturnType<typeof fetchAuthMe>>;

export function AccountPage() {
  const notify = useNotify();
  const [whoami, setWhoami] = useState<WhoAmI | null>(null);
  const [me, setMe] = useState<AuthMe | null>(null);
  const [ping, setPing] = useState<{ ok: boolean; role: string; at: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const [w, m] = await Promise.all([
        adminHttp<WhoAmI>("/api/admin/whoami"),
        fetchAuthMe(),
      ]);
      setWhoami(w);
      setMe(m);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Načítanie zlyhalo", {
        type: "error",
      });
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function adminPing() {
    try {
      const result = await adminHttp<{ ok: boolean; role: string; at: string }>(
        "/api/admin/ping",
      );
      setPing(result);
      notify("Admin ping OK", { type: "success" });
    } catch (err) {
      setPing(null);
      notify(
        err instanceof Error
          ? err.message
          : "Ping zlyhal (vyžaduje rolu Admin)",
        { type: "warning" },
      );
    }
  }

  return (
    <ToolShell
      title="Účet"
      eyebrow="Auth · AdminService"
      lead="Identita zo session a staff/admin overenie."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ToolCard title="Auth /me">
          {me ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Meno</dt>
                <dd>{me.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="break-all">{me.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-mono text-xs">
                  {(me.roles ?? []).join(", ") || "—"}
                </dd>
              </div>
              <div className="flex gap-3 pt-1 font-mono text-[11px] tracking-wide uppercase">
                <span className={me.isStaff ? "text-sage" : "text-stair-2"}>
                  staff {me.isStaff ? "yes" : "no"}
                </span>
                <span className={me.isAdmin ? "text-sage" : "text-muted-foreground"}>
                  admin {me.isAdmin ? "yes" : "no"}
                </span>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Načítavam…</p>
          )}
        </ToolCard>

        <ToolCard title="Admin whoami">
          {whoami ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">ID</dt>
                <dd className="break-all font-mono text-xs">{whoami.id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Meno</dt>
                <dd>{whoami.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-mono text-xs">
                  {(whoami.roles ?? []).join(", ") || "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Načítavam…</p>
          )}
          <Button
            variant="outlined"
            onClick={() => void load()}
            sx={{ mt: 2, mr: 1, borderRadius: 0 }}
          >
            Obnoviť
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => void adminPing()}
            sx={{ mt: 2, borderRadius: 0 }}
          >
            Admin ping
          </Button>
          {ping ? (
            <p className="mt-3 font-mono text-xs text-sage">
              ok · {ping.role} · {ping.at}
            </p>
          ) : null}
        </ToolCard>
      </div>
    </ToolShell>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { adminHttp } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type AuthSettings = {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  audience: string;
  apiScope: string;
  authority: string;
  grantStaffInDevelopment: boolean;
  redirectUriHint: string;
  loginNotice: string | null;
  updatedAt: string | null;
  hasOverrides: boolean;
};

export function AuthSettingsPage() {
  const notify = useNotify();
  const [settings, setSettings] = useState<AuthSettings | null>(null);
  const [redirectUriHint, setRedirectUriHint] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminHttp<AuthSettings>("/api/auth/settings");
      setSettings(data);
      setRedirectUriHint(data.redirectUriHint ?? "");
      setLoginNotice(data.loginNotice ?? "");
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Načítanie Auth nastavení zlyhalo (vyžaduje administrátora)",
        { type: "error" },
      );
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await adminHttp<AuthSettings>(
        "/api/auth/settings",
        { method: "PUT" },
        {
          redirectUriHint: redirectUriHint.trim(),
          loginNotice: loginNotice.trim() || null,
        },
      );
      setSettings(data);
      setRedirectUriHint(data.redirectUriHint ?? "");
      setLoginNotice(data.loginNotice ?? "");
      notify("Auth nastavenia uložené", { type: "info" });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Uloženie zlyhalo", {
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ToolShell
      title="Auth nastavenia"
      eyebrow="AuthService · Entra"
      lead="Úprava prezentačných nastavení prihlásenia bez redeployu. Tenant / Client ID / Audience zostávajú v appsettings všetkých služieb — meniť ich len cez konfiguráciu + reštart."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ToolCard title="Entra (len na čítanie)">
          {!settings ? (
            <p className="text-sm text-muted-foreground">Načítavam…</p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  size="small"
                  label={settings.enabled ? "Entra zapnuté" : "DevAuth (Entra vypnuté)"}
                  color={settings.enabled ? "success" : "default"}
                />
                {settings.grantStaffInDevelopment ? (
                  <Chip size="small" label="GrantStaffInDevelopment" variant="outlined" />
                ) : null}
                {settings.hasOverrides ? (
                  <Chip size="small" label="DB override aktívny" color="primary" variant="outlined" />
                ) : null}
              </div>
              <div>
                <dt className="text-muted-foreground">Tenant ID</dt>
                <dd className="font-mono text-xs break-all">{settings.tenantId || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Client ID</dt>
                <dd className="font-mono text-xs break-all">{settings.clientId || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Audience</dt>
                <dd className="font-mono text-xs break-all">{settings.audience || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">API scope</dt>
                <dd className="font-mono text-xs break-all">{settings.apiScope || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Authority</dt>
                <dd className="font-mono text-xs break-all">{settings.authority || "—"}</dd>
              </div>
              {settings.updatedAt ? (
                <div>
                  <dt className="text-muted-foreground">Override uložený</dt>
                  <dd>{new Date(settings.updatedAt).toLocaleString("sk-SK")}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </ToolCard>

        <ToolCard title="Upraviteľné (AuthService)">
          {!settings ? (
            <p className="text-sm text-muted-foreground">Načítavam…</p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <TextField
                label="Redirect URI hint"
                value={redirectUriHint}
                onChange={(e) => setRedirectUriHint(e.target.value)}
                fullWidth
                size="small"
                helperText="MSAL / SSR fallback, napr. http://localhost:3000/login"
                required
              />
              <TextField
                label="Oznam na prihlásení"
                value={loginNotice}
                onChange={(e) => setLoginNotice(e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={3}
                helperText="Voliteľný slovenský text pre stránku /login (prázdne = bez oznamu)."
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? "Ukladám…" : "Uložiť"}
                </Button>
                <Button type="button" variant="outlined" onClick={() => void load()} disabled={saving}>
                  Obnoviť
                </Button>
              </div>
            </form>
          )}
        </ToolCard>
      </div>
    </ToolShell>
  );
}

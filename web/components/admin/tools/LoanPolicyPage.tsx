"use client";

import { useEffect, useState } from "react";
import { useNotify } from "react-admin";
import { useAction } from "next-safe-action/hooks";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";
import {
  getLoanPolicyAction,
  updateLoanPolicyAction,
  type LoanPolicy,
} from "@/lib/bookings";
export function LoanPolicyPage() {
  const notify = useNotify();
  const load = useAction(getLoanPolicyAction);
  const save = useAction(updateLoanPolicyAction);
  const [form, setForm] = useState<LoanPolicy | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await load.executeAsync({});
      if (result?.data) setForm(result.data);
      else if (result?.serverError) {
        notify(result.serverError, { type: "error" });
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    const result = await save.executeAsync({
      defaultLoanDays: form.defaultLoanDays,
      maxActiveLoansPerReader: form.maxActiveLoansPerReader,
      renewExtraDays: form.renewExtraDays,
      maxRenewals: form.maxRenewals,
      freezeNewLoans: form.freezeNewLoans,
      schoolYearEndUtc: form.schoolYearEndUtc ?? null,
      reminderDaysBeforeDue: form.reminderDaysBeforeDue,
      skipNonSchoolDays: form.skipNonSchoolDays,
    });
    if (result?.data) {
      setForm(result.data);
      notify("Pravidlá výpožičiek uložené", { type: "info" });
    } else if (result?.serverError) {
      notify(result.serverError, { type: "error" });
    }
  }

  function patch<K extends keyof LoanPolicy>(key: K, value: LoanPolicy[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <ToolShell
      title="Pravidlá výpožičiek"
      eyebrow="BookingService · politika"
      lead="Úprava dĺžky výpožičky, limitov a zmrazenia nových rezervácií bez reštartu služby. Kód krajiny sviatkov zostáva v konfigurácii (appsettings)."
    >
      <ToolCard title="Efektívne nastavenia">
        {!form ? (
          <p className="text-sm text-muted-foreground">Načítavam politiku…</p>
        ) : (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <TextField
              label="Predvolená dĺžka (dni)"
              type="number"
              value={form.defaultLoanDays}
              onChange={(e) =>
                patch("defaultLoanDays", Number.parseInt(e.target.value, 10) || 0)
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Max. aktívnych výpožičiek na čitateľa"
              type="number"
              value={form.maxActiveLoansPerReader}
              onChange={(e) =>
                patch(
                  "maxActiveLoansPerReader",
                  Number.parseInt(e.target.value, 10) || 0,
                )
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Dni pri predĺžení"
              type="number"
              value={form.renewExtraDays}
              onChange={(e) =>
                patch("renewExtraDays", Number.parseInt(e.target.value, 10) || 0)
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Max. počet predĺžení"
              type="number"
              value={form.maxRenewals}
              onChange={(e) =>
                patch("maxRenewals", Number.parseInt(e.target.value, 10) || 0)
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Pripomenutie (dni pred termínom)"
              type="number"
              value={form.reminderDaysBeforeDue}
              onChange={(e) =>
                patch(
                  "reminderDaysBeforeDue",
                  Number.parseInt(e.target.value, 10) || 0,
                )
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Koniec školského roka (ISO UTC, voliteľné)"
              value={form.schoolYearEndUtc ?? ""}
              onChange={(e) =>
                patch("schoolYearEndUtc", e.target.value || null)
              }
              fullWidth
              size="small"
              helperText="Prázdne = bez pevného limitu"
            />
            <div className="md:col-span-2 flex flex-col gap-2">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.freezeNewLoans}
                    onChange={(_, checked) => patch("freezeNewLoans", checked)}
                  />
                }
                label="Zmraziť nové rezervácie"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.skipNonSchoolDays}
                    onChange={(_, checked) => patch("skipNonSchoolDays", checked)}
                  />
                }
                label="Preskakovať víkendy a sviatky pri termíne"
              />
              {form.holidayCountryCode ? (
                <p className="font-mono text-[11px] text-muted-foreground">
                  Kód krajiny sviatkov: {form.holidayCountryCode} (iba z konfigurácie)
                </p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                variant="contained"
                disabled={save.isPending}
              >
                {save.isPending ? "Ukladám…" : "Uložiť"}
              </Button>
            </div>
          </form>
        )}
      </ToolCard>
    </ToolShell>
  );
}
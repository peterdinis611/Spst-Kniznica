"use client";

import { useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { adminHttp } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type LifecycleBatchResult = {
  markedOverdue: number;
  remindersQueued: number;
  overdueIds?: string[];
  reminderBookingIds?: string[];
};

export function LifecycleToolsPage() {
  const notify = useNotify();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<LifecycleBatchResult | null>(null);

  async function run(path: string, label: string) {
    setBusy(true);
    try {
      const result = await adminHttp<LifecycleBatchResult>(path, {
        method: "POST",
      });
      setLast(result);
      notify(`${label}: hotovo`, { type: "success" });
    } catch (err) {
      notify(err instanceof Error ? err.message : `${label} zlyhalo`, {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Životný cyklus výpožičiek"
      eyebrow="BookingService · dávky"
      lead="Manuálne spustenie označenia oneskorení a fronty pripomienok (rovnaké akcie ako workers)."
    >
      <ToolCard title="Dávkové akcie">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="contained"
            color="secondary"
            disabled={busy}
            onClick={() =>
              void run(
                "/api/bookings/lifecycle/mark-overdue",
                "Mark overdue",
              )
            }
            sx={{ borderRadius: 0 }}
          >
            Označiť po termíne
          </Button>
          <Button
            variant="outlined"
            disabled={busy}
            onClick={() =>
              void run(
                "/api/bookings/lifecycle/due-reminders",
                "Due reminders",
              )
            }
            sx={{ borderRadius: 0 }}
          >
            Fronta pripomienok
          </Button>
        </div>
        {last ? (
          <dl className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
            <div>markedOverdue: {last.markedOverdue}</div>
            <div>remindersQueued: {last.remindersQueued}</div>
            <div>overdueIds: {last.overdueIds?.length ?? 0}</div>
            <div>
              reminderBookingIds: {last.reminderBookingIds?.length ?? 0}
            </div>
          </dl>
        ) : null}
      </ToolCard>
    </ToolShell>
  );
}

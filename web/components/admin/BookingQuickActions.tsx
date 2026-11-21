"use client";

import { useState } from "react";
import { useNotify, useRecordContext } from "react-admin";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import TextField from "@mui/material/TextField";
import { useAdminMutationRefresh } from "@/hooks/use-admin-ops";
import { adminHttp } from "@/lib/admin/http";
import { BOOKING_STATUS } from "@/lib/bookings/status";

/** Staff ops: checkout / return / renew / cancel (nie len PUT status). */
export function BookingQuickActions() {
  const record = useRecordContext();
  const notify = useNotify();
  const refreshAfterMutation = useAdminMutationRefresh();
  const [busy, setBusy] = useState(false);
  const [copyId, setCopyId] = useState("");

  if (!record) return null;

  const status = Number(record.status);
  const id = String(record.id);

  async function run(
    path: string,
    label: string,
    body: Record<string, unknown> = {},
  ) {
    setBusy(true);
    try {
      await adminHttp(path, { method: "POST" }, body);
      notify(label, { type: "info" });
      refreshAfterMutation();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Operácia zlyhala", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 py-1">
      {status === BOOKING_STATUS.reserved ? (
        <TextField
          size="small"
          label="Exemplár ID (voliteľné)"
          value={copyId}
          onChange={(e) => setCopyId(e.target.value)}
          helperText="UUID výtlačku pri vydaní"
          sx={{ maxWidth: 320, "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
        />
      ) : null}
      <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: 0 }}>
        {status === BOOKING_STATUS.reserved ? (
          <>
            <Button
              disabled={busy}
              onClick={() =>
                void run(
                  `/api/bookings/${id}/checkout`,
                  "Vydané",
                  copyId.trim() ? { bookCopyId: copyId.trim() } : {},
                )
              }
              sx={{ borderRadius: 0 }}
            >
              Vydať
            </Button>
            <Button
              disabled={busy}
              color="error"
              onClick={() =>
                void run(`/api/bookings/${id}/cancel`, "Zrušené")
              }
              sx={{ borderRadius: 0 }}
            >
              Zrušiť
            </Button>
          </>
        ) : null}
        {status === BOOKING_STATUS.active ||
        status === BOOKING_STATUS.overdue ? (
          <>
            <Button
              disabled={busy}
              color="success"
              onClick={() =>
                void run(`/api/bookings/${id}/return`, "Vrátené")
              }
              sx={{ borderRadius: 0 }}
            >
              Vrátiť
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                void run(`/api/bookings/${id}/renew`, "Predĺžené", {})
              }
              sx={{ borderRadius: 0 }}
            >
              Predĺžiť
            </Button>
          </>
        ) : null}
      </ButtonGroup>
    </div>
  );
}

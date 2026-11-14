"use client";

import { useNotify, useRecordContext, useRefresh, useUpdate } from "react-admin";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { BOOKING_STATUS } from "@/lib/bookings/status";

/** Inline status transitions on the bookings list. */
export function BookingQuickActions() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [update, { isPending }] = useUpdate();

  if (!record) return null;

  const status = Number(record.status);

  function apply(next: number, label: string) {
    update(
      "bookings",
      {
        id: record!.id,
        data: {
          ...record,
          status: next,
        },
        previousData: record,
      },
      {
        onSuccess: () => {
          notify(`Stav → ${label}`, { type: "info" });
          refresh();
        },
        onError: (err) => {
          notify(err instanceof Error ? err.message : "Update zlyhal", {
            type: "error",
          });
        },
      },
    );
  }

  return (
    <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: 0 }}>
      {status === BOOKING_STATUS.reserved ? (
        <>
          <Button
            disabled={isPending}
            onClick={() => apply(BOOKING_STATUS.active, "Požičané")}
            sx={{ borderRadius: 0 }}
          >
            Vydať
          </Button>
          <Button
            disabled={isPending}
            color="error"
            onClick={() => apply(BOOKING_STATUS.cancelled, "Zrušené")}
            sx={{ borderRadius: 0 }}
          >
            Zrušiť
          </Button>
        </>
      ) : null}
      {status === BOOKING_STATUS.active || status === BOOKING_STATUS.overdue ? (
        <Button
          disabled={isPending}
          color="success"
          onClick={() => apply(BOOKING_STATUS.returned, "Vrátené")}
          sx={{ borderRadius: 0 }}
        >
          Vrátiť
        </Button>
      ) : null}
    </ButtonGroup>
  );
}

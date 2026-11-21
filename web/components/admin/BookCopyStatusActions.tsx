"use client";

import { useState } from "react";
import { useNotify, useRecordContext } from "react-admin";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { useAdminMutationRefresh } from "@/hooks/use-admin-ops";
import { adminHttp } from "@/lib/admin/http";
import { COPY_STATUS_CHOICES } from "@/components/admin/shared";

const STAFF_TARGETS = [0, 3, 4] as const;

type UpdateCopyStatusResult = {
  copy: { id: string; status: number };
  availableCopies: number;
  totalCopies: number;
};

type BookCopyStatusActionsProps = {
  bookId: string;
};

export function BookCopyStatusActions({ bookId }: BookCopyStatusActionsProps) {
  const copy = useRecordContext();
  const notify = useNotify();
  const refreshAfterMutation = useAdminMutationRefresh();
  const [busy, setBusy] = useState(false);

  if (!copy || !bookId) return null;

  const status = Number(copy.status);
  const inventory =
    typeof copy.inventoryNumber === "string" ? copy.inventoryNumber : "";

  async function apply(next: (typeof STAFF_TARGETS)[number]) {
    const label =
      COPY_STATUS_CHOICES.find((choice) => choice.id === next)?.name ??
      String(next);
    setBusy(true);
    try {
      await adminHttp<UpdateCopyStatusResult>(
        `/api/books/${bookId}/copies/${copy!.id}`,
        { method: "PATCH" },
        { status: next },
      );
      notify(
        inventory
          ? `${inventory} → ${label}`
          : `Stav výtlačku → ${label}`,
        { type: "info" },
      );
      refreshAfterMutation();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Aktualizácia zlyhala", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: 0 }}>
      {STAFF_TARGETS.filter((target) => target !== status).map((target) => {
        const label =
          COPY_STATUS_CHOICES.find((choice) => choice.id === target)?.name ??
          String(target);
        return (
          <Button
            key={target}
            disabled={busy}
            onClick={() => void apply(target)}
            sx={{ borderRadius: 0 }}
            color={target === 3 ? "error" : target === 4 ? "warning" : "primary"}
          >
            {label}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
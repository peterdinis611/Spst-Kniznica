"use client";

import { useState } from "react";
import { Link as RaLink } from "react-router-dom";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useAdminMutationRefresh } from "@/hooks/use-admin-ops";
import { adminHttp, adminQuery } from "@/lib/admin/http";
import {
  BOOKING_STATUS,
  bookingItemsOf,
  type DeskBooking,
  mapBooking,
  type BookingDto,
} from "@/lib/bookings";
import {
  mapBookCopyLookup,
  type BookCopyLookup,
  type BookCopyLookupDto,
} from "@/lib/catalog/copy-lookup";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

export function BarcodeToolsPage() {
  const notify = useNotify();
  const refreshAfterMutation = useAdminMutationRefresh();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [lookup, setLookup] = useState<BookCopyLookup | null>(null);
  const [matchBooking, setMatchBooking] = useState<DeskBooking | null>(null);

  async function runLookup() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setLookup(null);
    setMatchBooking(null);
    try {
      const raw = await adminHttp<BookCopyLookupDto>(
        adminQuery("/api/books/copies/lookup", { code: trimmed }),
      );
      const copy = mapBookCopyLookup(raw);
      setLookup(copy);
      setCode("");

      const page = await adminHttp<unknown>(
        adminQuery("/api/bookings", {
          bookId: copy.bookId,
          page: 1,
          pageSize: 40,
        }),
      );
      const items = bookingItemsOf(page).map(mapBooking);
      const reserved = items.find(
        (b) => b.status === BOOKING_STATUS.reserved && !b.bookCopyId,
      );
      const activeOnCopy = items.find(
        (b) =>
          b.bookCopyId === copy.copyId &&
          (b.status === BOOKING_STATUS.active ||
            b.status === BOOKING_STATUS.overdue),
      );
      setMatchBooking(activeOnCopy ?? reserved ?? null);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Výtlačok sa nenašiel", {
        type: "warning",
      });
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    if (!lookup || !matchBooking) return;
    setBusy(true);
    try {
      await adminHttp<BookingDto>(
        `/api/bookings/${matchBooking.id}/checkout`,
        { method: "POST" },
        { bookCopyId: lookup.copyId },
      );
      notify(`Vydané: ${lookup.bookTitle}`, { type: "success" });
      setLookup(null);
      setMatchBooking(null);
      refreshAfterMutation();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Vydanie zlyhalo", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function returnLoan() {
    if (!matchBooking) return;
    setBusy(true);
    try {
      await adminHttp(
        `/api/bookings/${matchBooking.id}/return`,
        { method: "POST" },
        {},
      );
      notify("Vrátené", { type: "success" });
      setLookup(null);
      setMatchBooking(null);
      refreshAfterMutation();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Vrátenie zlyhalo", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Skener / čiarový kód"
      eyebrow="BookService · copies/lookup"
      lead="Inventárne číslo alebo barcode → nájdi výtlačok, priraď rezerváciu a vydaj / vráť."
    >
      <ToolCard title="Načítať kód">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void runLookup();
          }}
        >
          <TextField
            size="small"
            fullWidth
            autoFocus
            label="Inventár / barcode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={busy || !code.trim()}
            sx={{ borderRadius: 0, whiteSpace: "nowrap" }}
          >
            {busy ? "Hľadám…" : "Nájsť"}
          </Button>
        </form>
      </ToolCard>

      {lookup ? (
        <ToolCard title="Výtlačok">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Titul</dt>
              <dd className="text-right font-display text-base text-ink">
                {lookup.bookTitle}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Autor</dt>
              <dd className="text-right">{lookup.bookAuthor}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Inventár</dt>
              <dd className="font-mono text-xs">{lookup.inventoryNumber}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Stav</dt>
              <dd className="font-mono text-xs">{lookup.statusLabel}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              component={RaLink}
              to={`/books/${lookup.bookId}/show`}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 0 }}
            >
              Kniha v admin
            </Button>
          </div>
        </ToolCard>
      ) : null}

      {matchBooking ? (
        <ToolCard title="Naviazaná výpožička">
          <p className="text-sm text-ink">
            {matchBooking.borrowerName} · {matchBooking.borrowerEmail}
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            termín {new Date(matchBooking.dueDate).toLocaleString("sk-SK")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {matchBooking.status === BOOKING_STATUS.reserved ? (
              <Button
                variant="contained"
                color="secondary"
                disabled={busy}
                onClick={() => void checkout()}
                sx={{ borderRadius: 0 }}
              >
                Vydať s týmto výtlačkom
              </Button>
            ) : null}
            {matchBooking.status === BOOKING_STATUS.active ||
            matchBooking.status === BOOKING_STATUS.overdue ? (
              <Button
                variant="contained"
                color="success"
                disabled={busy}
                onClick={() => void returnLoan()}
                sx={{ borderRadius: 0 }}
              >
                Vrátiť
              </Button>
            ) : null}
            <Button
              component={RaLink}
              to={`/bookings/${matchBooking.id}/show`}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 0 }}
            >
              Detail
            </Button>
          </div>
        </ToolCard>
      ) : lookup ? (
        <p className="text-sm text-muted-foreground">
          Pre tento titul nie je rezervácia bez výtlačku ani aktívna výpožička
          na tento exemplár.
        </p>
      ) : null}
    </ToolShell>
  );
}

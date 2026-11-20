"use client";

import { useState } from "react";
import { Link as RaLink } from "react-router-dom";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { adminHttp, adminQuery } from "@/lib/admin/http";
import { COPY_STATUS_LABEL } from "@/lib/catalog/mappers";
import { BOOKING_STATUS } from "@/lib/bookings/status";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type CopyLookup = {
  copyId: string;
  bookId: string;
  inventoryNumber: string;
  barcode?: string | null;
  status: number | string;
  bookTitle: string;
  bookAuthor: string;
};

type BookingRow = {
  id: string;
  bookId: string;
  bookCopyId?: string | null;
  borrowerName: string;
  borrowerEmail: string;
  status: number | string;
  dueDate: string;
};

type PagedBookings = {
  items?: BookingRow[];
  Items?: BookingRow[];
};

function statusNum(value: number | string): number {
  if (typeof value === "number") return value;
  const named: Record<string, number> = {
    Available: 0,
    Borrowed: 1,
    Reserved: 2,
    Lost: 3,
    Maintenance: 4,
  };
  if (value in named) return named[value]!;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function BarcodeToolsPage() {
  const notify = useNotify();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [lookup, setLookup] = useState<CopyLookup | null>(null);
  const [matchBooking, setMatchBooking] = useState<BookingRow | null>(null);

  async function runLookup() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setLookup(null);
    setMatchBooking(null);
    try {
      const copy = await adminHttp<CopyLookup>(
        adminQuery("/api/books/copies/lookup", { code: trimmed }),
      );
      setLookup(copy);
      setCode("");

      const page = await adminHttp<PagedBookings>(
        adminQuery("/api/bookings", {
          bookId: copy.bookId,
          page: 1,
          pageSize: 40,
        }),
      );
      const items = page.items ?? page.Items ?? [];
      const reserved = items.find(
        (b) =>
          Number(b.status) === BOOKING_STATUS.reserved && !b.bookCopyId,
      );
      const activeOnCopy = items.find(
        (b) =>
          String(b.bookCopyId) === String(copy.copyId) &&
          (Number(b.status) === BOOKING_STATUS.active ||
            Number(b.status) === BOOKING_STATUS.overdue),
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
      await adminHttp(
        `/api/bookings/${matchBooking.id}/checkout`,
        { method: "POST" },
        { bookCopyId: lookup.copyId },
      );
      notify(`Vydané: ${lookup.bookTitle}`, { type: "success" });
      setLookup(null);
      setMatchBooking(null);
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
    } catch (err) {
      notify(err instanceof Error ? err.message : "Vrátenie zlyhalo", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  const copyStatus = lookup ? statusNum(lookup.status) : null;
  const bookingStatus = matchBooking
    ? Number(matchBooking.status)
    : null;

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
              <dd className="font-mono text-xs">
                {COPY_STATUS_LABEL[copyStatus ?? -1] ?? String(lookup.status)}
              </dd>
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
            {bookingStatus === BOOKING_STATUS.reserved ? (
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
            {bookingStatus === BOOKING_STATUS.active ||
            bookingStatus === BOOKING_STATUS.overdue ? (
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

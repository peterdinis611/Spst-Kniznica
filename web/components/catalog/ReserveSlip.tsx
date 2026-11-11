"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { ArrowRight } from "lucide-react";
import { createBookingAction } from "@/lib/actions/bookings";
import {
  formatDeskDate,
  getReaderSnapshot,
  getServerReaderSnapshot,
  subscribeReader,
  toDueDateIso,
  writeReader,
} from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReserveSlipProps = {
  bookId: string;
  title: string;
  available: boolean;
};

function dateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return dateInputValue(date);
}

function firstValidationMessage(errors: unknown): string | undefined {
  if (!errors || typeof errors !== "object") return undefined;
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const list = (value as { _errors?: string[] })._errors;
    if (list?.[0]) return list[0];
  }
  return undefined;
}

export function ReserveSlip({ bookId, title, available }: ReserveSlipProps) {
  const stored = useSyncExternalStore(
    subscribeReader,
    getReaderSnapshot,
    getServerReaderSnapshot,
  );
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [notes, setNotes] = useState("");
  const { execute, result, isPending, reset } = useAction(createBookingAction);
  const nameValue = name ?? stored?.name ?? "";
  const emailValue = email ?? stored?.email ?? "";

  const issued = result.data;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeReader({ name: nameValue, email: emailValue });
    execute({
      bookId,
      borrowerName: nameValue,
      borrowerEmail: emailValue,
      dueDate: toDueDateIso(dueDate),
      notes: notes.trim() || undefined,
    });
  }

  if (issued) {
    return (
      <section className="reveal relative mt-8 max-w-xl overflow-hidden border border-ink bg-accent p-6 text-black sm:p-7">
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase">
          Lístok vystavený
        </p>
        <p className="mt-4 inline-flex -rotate-6 border-2 border-black px-3 py-1 font-display text-sm tracking-[0.2em] uppercase">
          Rezervované
        </p>
        <h2 className="mt-5 font-display text-4xl leading-none tracking-tight">
          {formatDeskDate(issued.dueDate)}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-black/75">
          {issued.borrowerName} má {title} rezervované do tohto termínu. Lístok
          je na výpožičnom pulte.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="h-11 rounded-none bg-black px-5 text-white hover:bg-black/85"
            render={<Link href={`/bookings?book=${bookId}`} />}
          >
            Otvoriť pult
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-none border-black bg-transparent text-black hover:bg-black hover:text-accent"
            onClick={() => reset()}
          >
            Ďalší lístok
          </Button>
        </div>
      </section>
    );
  }

  const error =
    result.serverError ?? firstValidationMessage(result.validationErrors);

  return (
    <section className="relative mt-8 max-w-xl border border-rule bg-paper-deep/70 p-5 sm:p-6 dark:border-white/10">
      <span
        aria-hidden
        className="absolute top-4 bottom-4 left-3 border-l border-dashed border-ink/25"
      />
      <div className="pl-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Výpožičný lístok
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight text-ink">
              Rezervovať titul
            </h2>
          </div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            SPST
            <br />
            14 dní
          </p>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {available
            ? "Lístok ide priamo do BookingService. Meno a email si prehliadač zapamätá na ďalší raz — účet zatiaľ nie je napojený."
            : "Voľný exemplár práve nie je. Rezerváciu vystavíš, keď sa titul vráti do fondu."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="borrower-name">Meno</Label>
              <Input
                id="borrower-name"
                name="borrowerName"
                autoComplete="name"
                value={nameValue}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={!available || isPending}
                placeholder="Anna Nováková"
                className="h-11 rounded-none border-rule bg-paper dark:border-white/15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrower-email">Email</Label>
              <Input
                id="borrower-email"
                name="borrowerEmail"
                type="email"
                autoComplete="email"
                value={emailValue}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={!available || isPending}
                placeholder="anna.novakova@spst.sk"
                className="h-11 rounded-none border-rule bg-paper dark:border-white/15"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-2">
              <Label htmlFor="due-date">Termín vrátenia</Label>
              <Input
                id="due-date"
                name="dueDate"
                type="date"
                value={dueDate}
                min={dateInputValue(new Date())}
                onChange={(event) => setDueDate(event.target.value)}
                required
                disabled={!available || isPending}
                className="h-11 rounded-none border-rule bg-paper dark:border-white/15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Poznámka</Label>
              <Input
                id="notes"
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={!available || isPending}
                placeholder="Študentská výpožička"
                className="h-11 rounded-none border-rule bg-paper dark:border-white/15"
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-stair-2" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={!available || isPending}
            className="h-11 rounded-none bg-accent px-5 text-black hover:bg-accent-deep"
          >
            {isPending ? "Vystavujem…" : "Vystaviť lístok"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      </div>
    </section>
  );
}

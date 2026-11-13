"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { resolveActionAccessToken } from "@/lib/auth/access-token";
import {
  createBookingAction,
  formatDeskDate,
  toDueDateIso,
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
  const { ready, entraEnabled, user, login, getAccessToken } = useAuth();
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [notes, setNotes] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const { execute, result, isPending, reset } = useAction(createBookingAction);

  const issued = result.data;
  const authenticated = Boolean(user?.isAuthenticated);
  const displayName = user?.name ?? "";
  const displayEmail = user?.email ?? "";

  useEffect(() => {
    setClientError(null);
  }, [user?.id]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    if (!authenticated || !displayEmail) {
      setClientError("Na výpožičný lístok sa musíš prihlásiť.");
      return;
    }

    try {
      const accessToken = await resolveActionAccessToken({
        entraEnabled,
        getAccessToken,
      });
      execute({
        accessToken,
        bookId,
        borrowerName: displayName || displayEmail,
        borrowerEmail: displayEmail,
        dueDate: toDueDateIso(dueDate),
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Prihlásenie zlyhalo.");
    }
  }

  if (!ready) {
    return (
      <section className="relative mt-8 max-w-xl border border-rule bg-paper-deep/70 p-5 sm:p-6 dark:border-white/10">
        <p className="text-sm text-muted-foreground">Načítavam prístup…</p>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="relative mt-8 max-w-xl border border-rule bg-paper-deep/70 p-5 sm:p-6 dark:border-white/10">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
          Výpožičný lístok
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-ink">
          Prihlásenie je povinné
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Rezerváciu môže vystaviť len prihlásený používateľ. Údaje (meno, email)
          sa vezmú z tvojho účtu{entraEnabled ? " (Entra)" : ""}.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            className="h-11 rounded-none bg-accent px-5 text-accent-foreground hover:bg-accent-deep"
            onClick={() => void login()}
          >
            Prihlásiť sa
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-none border-ink"
            render={<Link href="/login" />}
          >
            Otvoriť /login
          </Button>
        </div>
      </section>
    );
  }

  if (issued) {
    return (
      <section className="on-accent reveal relative mt-8 max-w-xl overflow-hidden border border-ink bg-accent p-6 sm:p-7">
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase">
          Lístok vystavený
        </p>
        <p className="mt-4 inline-flex -rotate-6 border-2 border-accent-foreground px-3 py-1 font-display text-sm tracking-[0.2em] uppercase">
          Rezervované
        </p>
        <h2 className="mt-5 font-display text-4xl leading-none tracking-tight">
          {formatDeskDate(issued.dueDate)}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-75">
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
            className="h-11 rounded-none border-accent-foreground bg-transparent text-accent-foreground hover:bg-accent-foreground hover:text-accent"
            onClick={() => reset()}
          >
            Ďalší lístok
          </Button>
        </div>
      </section>
    );
  }

  const error =
    clientError ??
    result.serverError ??
    firstValidationMessage(result.validationErrors);

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
            ? "Lístok ide pod tvoj účet do BookingService. Meno a email sú z prihlásenia."
            : "Voľný exemplár práve nie je. Rezerváciu vystavíš, keď sa titul vráti do fondu."}
        </p>

        <dl className="mt-4 grid gap-2 border border-rule bg-paper/60 px-3 py-3 text-sm dark:border-white/10">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Čitateľ</dt>
            <dd className="font-medium text-ink">{displayName || displayEmail}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-mono text-xs text-ink">{displayEmail}</dd>
          </div>
        </dl>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
            className="h-11 rounded-none bg-accent px-5 text-accent-foreground hover:bg-accent-deep"
          >
            {isPending ? "Vystavujem…" : "Vystaviť lístok"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      </div>
    </section>
  );
}

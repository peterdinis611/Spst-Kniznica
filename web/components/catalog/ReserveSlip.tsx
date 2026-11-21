"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { ArrowRight, Ticket } from "@/components/icons";
import { useAnnounce } from "@/components/a11y/LiveAnnouncer";
import { SignInRequiredNotice } from "@/components/auth/NotAuthorizedNotice";
import { useAuth } from "@/components/auth/AuthProvider";
import { resolveActionAccessToken } from "@/lib/auth/access-token";
import { resolveUserDisplayName } from "@/lib/auth/display-name";
import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS,
  createBookingAction,
  formatDeskDate,
  getLoanPolicyAction,
  joinWaitlistAction,
  normalizeBookingStatus,
  searchBookingsAction,
  toDueDateIso,
} from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FavoriteToggle } from "@/components/catalog/FavoriteToggle";

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

function defaultDueDate(days = 14): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
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

function SlipPanel({
  children,
  className,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-y-auto overflow-x-hidden",
        accent && "bg-accent text-accent-foreground",
        className,
      )}
    >
      {!accent ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,color-mix(in_oklch,var(--mint),transparent_72%),transparent)] dark:bg-[radial-gradient(ellipse_60%_45%_at_100%_-10%,color-mix(in_oklch,var(--sage),transparent_88%),transparent)]"
          aria-hidden
        />
      ) : null}
      <div className="relative p-4 sm:p-6 md:p-8">{children}</div>
    </div>
  );
}

function readerInitials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function ReserveSlip({ bookId, title, available }: ReserveSlipProps) {
  const { ready, entraEnabled, user, account, getAccessToken } = useAuth();
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const [loanDays, setLoanDays] = useState(14);
  const [dueDate, setDueDate] = useState(() => defaultDueDate(14));
  const [notes, setNotes] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const { execute, result, isPending, reset } = useAction(createBookingAction);
  const policy = useAction(getLoanPolicyAction);
  const waitlist = useAction(joinWaitlistAction);
  const {
    execute: lookupOpenBookings,
    result: lookupMineResult,
  } = useAction(searchBookingsAction);

  const issued = result.data;
  const authenticated = Boolean(user?.isAuthenticated);
  const displayName = user ? resolveUserDisplayName(user, account) : "";
  const displayEmail = user?.email ?? "";
  const formIds = useId();
  const dueDateId = `${formIds}-due-date`;
  const notesId = `${formIds}-notes`;
  const errorId = `${formIds}-error`;

  useEffect(() => {
    setClientError(null);
  }, [user?.id]);

  useEffect(() => {
    void policy.execute({});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const days = policy.result.data?.defaultLoanDays;
    if (typeof days === "number" && days > 0) {
      setLoanDays(days);
      setDueDate(defaultDueDate(days));
    }
  }, [policy.result.data?.defaultLoanDays]);

  useEffect(() => {
    if (!authenticated || !displayEmail) return;
    lookupOpenBookings({
      bookId,
      borrowerEmail: displayEmail,
      page: 1,
      pageSize: 5,
    });
  }, [authenticated, bookId, displayEmail, lookupOpenBookings]);

  useEffect(() => {
    if (issued) setOpen(true);
  }, [issued]);

  const error =
    clientError ??
    result.serverError ??
    firstValidationMessage(result.validationErrors);

  useEffect(() => {
    if (error) announce(error, "assertive");
  }, [error, announce]);

  useEffect(() => {
    if (issued) {
      announce(`Výpožičný lístok pre ${title} bol vystavený.`, "polite");
    }
  }, [issued, title, announce]);

  useEffect(() => {
    if (waitlistJoined) {
      announce(`Bol si zaradený do čakacieho zoznamu pre ${title}.`, "polite");
    }
  }, [waitlistJoined, title, announce]);

  const existingOpen = (lookupMineResult?.data?.items ?? []).find((item) => {
    const status = normalizeBookingStatus(item.status);
    return (
      status === BOOKING_STATUS.reserved ||
      status === BOOKING_STATUS.active ||
      status === BOOKING_STATUS.overdue
    );
  });

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

  const triggerLabel = !ready
    ? "Načítavam…"
    : existingOpen
      ? "Môj výpožičný lístok"
      : issued
        ? "Lístok vystavený"
        : available
          ? "Rezervovať titul"
          : "Rezervácia (obsadené)";

  function dialogBody() {
    if (!ready) {
      return (
        <SlipPanel>
          <p className="text-sm text-muted-foreground">Načítavam prístup…</p>
        </SlipPanel>
      );
    }

    if (!authenticated) {
      return (
        <SlipPanel>
          <SignInRequiredNotice
            variant="compact"
            className="max-w-none border-0 bg-transparent px-0 py-0 shadow-none"
            eyebrow="Výpožičný lístok"
            title="Prihlásenie je povinné"
            description={`Rezerváciu môže vystaviť len prihlásený používateľ. Údaje (meno, email) sa vezmú z tvojho účtu${entraEnabled ? " (Entra)" : ""}.`}
            hint="Zavri dialóg a prihlás sa cez „Prihlásiť“ v hornej lište."
          />
        </SlipPanel>
      );
    }

    if (existingOpen && !issued) {
      return (
        <SlipPanel>
          <DialogHeader className="text-left">
            <p className="text-eyebrow font-mono text-[11px] font-semibold tracking-[0.22em] uppercase">
              Výpožičný lístok
            </p>
            <DialogTitle className="mt-2 text-[clamp(1.5rem,4vw,2rem)]">
              Už máš otvorený lístok
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-md leading-relaxed">
              Na titul <span className="font-medium text-ink">{title}</span> už
              nemôžeš vystaviť druhú rezerváciu. Termín vrátenia:{" "}
              <span className="font-medium text-ink">
                {formatDeskDate(existingOpen.dueDate)}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              className="h-11 rounded-none bg-accent px-5 text-accent-foreground hover:bg-accent-deep"
              render={<Link href={`/bookings?book=${bookId}`} />}
              onClick={() => setOpen(false)}
            >
              Moje výpožičky
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </SlipPanel>
      );
    }

    if (issued) {
      return (
        <SlipPanel accent>
          <div id="print-slip" className="print:text-black">
            <p className="font-mono text-[11px] font-semibold tracking-[0.22em] uppercase opacity-80">
              Lístok vystavený
            </p>
            <p className="mt-4 inline-flex -rotate-3 border border-accent-foreground/50 bg-accent-foreground/10 px-3 py-1 font-display text-sm tracking-[0.18em] uppercase print:rotate-0">
              Rezervované
            </p>
            <h2 className="mt-5 font-display text-3xl leading-none tracking-tight sm:text-4xl">
              {formatDeskDate(issued.dueDate)}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed break-words opacity-85">
              {issued.borrowerName} ·{" "}
              <span className="break-all">{issued.borrowerEmail}</span>
            </p>
            <p className="mt-1 max-w-md text-sm leading-relaxed break-words opacity-85">
              {title} — rezervované do tohto termínu. Lístok ID{" "}
              <span className="font-mono text-xs break-all">{issued.id}</span>
            </p>
            <p className="mt-4 font-mono text-[10px] tracking-[0.2em] uppercase opacity-70">
              *{issued.id.replace(/-/g, "").slice(0, 12)}*
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <Button
              className="h-11 rounded-none bg-ink px-5 text-paper hover:bg-ink/90"
              onClick={() => window.print()}
            >
              Tlačiť lístok
            </Button>
            <Button
              className="h-11 rounded-none bg-ink/80 px-5 text-paper hover:bg-ink/70"
              render={<Link href={`/library`} />}
              onClick={() => setOpen(false)}
            >
              Moja knižnica
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-none border-accent-foreground/50 bg-transparent text-accent-foreground hover:bg-accent-foreground/15"
              onClick={() => {
                reset();
              }}
            >
              Zavrieť
            </Button>
          </div>
        </SlipPanel>
      );
    }

    const initials = readerInitials(displayName, displayEmail);

    return (
      <SlipPanel>
        <SlipHeader available={available} title={title} />

        <div className="mt-6 flex flex-col gap-4 border-y border-rule py-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center border border-sage/30 bg-mint/60 font-display text-sm text-sage dark:border-sage/40 dark:bg-paper-deep"
              aria-hidden
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Čitateľ
              </p>
              <p className="truncate font-display text-lg text-ink">
                {displayName || displayEmail}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {displayEmail}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              Štandard
            </p>
            <p className="font-display text-2xl text-ink">{loanDays} dní</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={dueDateId} className="text-muted-foreground">
                Termín vrátenia
              </Label>
              <Input
                id={dueDateId}
                name="dueDate"
                type="date"
                value={dueDate}
                min={dateInputValue(new Date())}
                onChange={(event) => setDueDate(event.target.value)}
                required
                disabled={!available || isPending}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? errorId : undefined}
                className="h-11 rounded-none border-rule bg-paper focus-visible:border-sage focus-visible:ring-sage/30 dark:border-white/15 dark:bg-paper-deep"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={notesId} className="text-muted-foreground">
                Poznámka <span className="font-normal">(voliteľné)</span>
              </Label>
              <Input
                id={notesId}
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={!available || isPending}
                placeholder="Študentská výpožička"
                aria-invalid={Boolean(error) || undefined}
                className="h-11 rounded-none border-rule bg-paper focus-visible:border-sage focus-visible:ring-sage/30 dark:border-white/15 dark:bg-paper-deep"
              />
            </div>
          </div>

          {error ? (
            <p
              id={errorId}
              className="border border-stair-2/30 bg-stair-2/10 px-3 py-2 text-sm text-stair-2"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-none border-rule sm:w-auto"
              onClick={() => setOpen(false)}
            >
              Zrušiť
            </Button>
            {!available ? (
              <Button
                type="button"
                disabled={waitlist.isPending || waitlistJoined}
                className="h-11 w-full whitespace-normal rounded-none bg-ink px-4 text-sm leading-snug text-paper hover:bg-ink/90 sm:min-w-[14rem] sm:px-5 sm:whitespace-nowrap"
                onClick={async () => {
                  setClientError(null);
                  try {
                    const accessToken = await resolveActionAccessToken({
                      entraEnabled,
                      getAccessToken,
                    });
                    const result = await waitlist.executeAsync({
                      accessToken,
                      bookId,
                      borrowerName: displayName || displayEmail,
                    });
                    if (result?.serverError) {
                      setClientError(result.serverError);
                    } else {
                      setWaitlistJoined(true);
                    }
                  } catch (err) {
                    setClientError(
                      err instanceof Error ? err.message : "Fronta zlyhala.",
                    );
                  }
                }}
              >
                {waitlistJoined
                  ? "Si vo fronte"
                  : waitlist.isPending
                    ? "Zaraďujem…"
                    : "Zaradiť do čakacieho zoznamu"}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isPending || policy.result.data?.freezeNewLoans}
                className="group h-11 w-full rounded-none bg-accent px-5 text-accent-foreground hover:bg-accent-deep sm:w-auto sm:min-w-[14rem]"
              >
                {isPending ? "Vystavujem…" : "Vystaviť lístok"}
                <ArrowRight
                  className="size-4 transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Button>
            )}
          </div>
        </form>
      </SlipPanel>
    );
  }

  return (
    <div className="reveal mt-8 max-w-2xl sm:mt-10">
      <div className="flex flex-col gap-4 border border-rule bg-card/60 p-4 dark:border-white/12 dark:bg-surface-3/50 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-6">
        <div className="min-w-0">
          <p className="text-eyebrow font-mono text-[11px] font-semibold tracking-[0.22em] uppercase">
            Výpožička
          </p>
          <p className="mt-1 font-display text-lg leading-snug text-ink sm:text-2xl">
            {existingOpen
              ? "Máš aktívny lístok na tento titul"
              : "Chceš si knihu rezervovať?"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {existingOpen
              ? `Termín ${formatDeskDate(existingOpen.dueDate)} · otvor detail lístka`
              : available
                ? "Lístok vystavíš v dialógu — meno a email z účtu."
                : "Fond je momentálne obsadený, server rezerváciu aj tak odmietne."}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <FavoriteToggle bookId={bookId} />
          <Button
            type="button"
            disabled={!ready}
            className="h-12 w-full rounded-none bg-accent px-4 text-accent-foreground hover:bg-accent-deep sm:w-auto sm:px-5"
            onClick={() => setOpen(true)}
          >
            <Ticket className="size-4" strokeWidth={1.6} aria-hidden />
            {triggerLabel}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[min(92dvh,40rem)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] gap-0 overflow-hidden rounded-lg border-rule bg-card p-0 sm:w-full sm:max-w-lg sm:rounded-xl dark:bg-surface-3"
          aria-describedby={undefined}
        >
          <div className="sr-only">
            <DialogTitle>Výpožičný lístok — {title}</DialogTitle>
            <DialogDescription>
              Formulár rezervácie titulu v SPST Knižnici.
            </DialogDescription>
          </div>
          {dialogBody()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SlipHeader({
  available,
  title,
}: {
  available: boolean;
  title: string;
}) {
  return (
    <DialogHeader className="text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-lg">
          <p className="text-eyebrow font-mono text-[11px] font-semibold tracking-[0.22em] uppercase">
            Výpožičný lístok
          </p>
          <DialogTitle className="mt-2 text-[clamp(1.5rem,4vw,2rem)]">
            Rezervovať titul
          </DialogTitle>
          <DialogDescription className="mt-2 leading-relaxed">
            <span className="font-medium text-ink">{title}</span>
            {" · "}
            {available
              ? "Lístok sa uloží pod tvoj účet. Meno a email sú z prihlásenia."
              : "Voľný exemplár práve nie je — rezerváciu odošleš, keď sa titul vráti."}
          </DialogDescription>
        </div>
        <div
          className={cn(
            "inline-flex shrink-0 items-center gap-2 border px-3 py-2 font-mono text-[10px] tracking-[0.14em] uppercase",
            available
              ? "border-sage/35 bg-mint/40 text-sage dark:border-sage/40 dark:bg-paper-deep"
              : "border-rule text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              available ? "bg-sage" : "bg-muted-foreground",
            )}
            aria-hidden
          />
          {available ? "Fond: voľné kusy" : "Fond: obsadené"}
        </div>
      </div>
    </DialogHeader>
  );
}

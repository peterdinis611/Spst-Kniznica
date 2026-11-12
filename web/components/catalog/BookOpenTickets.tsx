import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { searchBookingsAction } from "@/lib/actions/bookings";
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
  duePhrase,
  formatDeskDate,
  normalizeBookingStatus,
  type BookingStatusCode,
} from "@/lib/bookings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BookOpenTicketsProps = {
  bookId: string;
};

function isOpenStatus(status: number): boolean {
  return (
    status === BOOKING_STATUS.reserved ||
    status === BOOKING_STATUS.active ||
    status === BOOKING_STATUS.overdue
  );
}

export async function BookOpenTickets({ bookId }: BookOpenTicketsProps) {
  const result = await searchBookingsAction({
    bookId,
    page: 1,
    pageSize: 8,
  });
  const items = (result?.data?.items ?? []).filter((item) =>
    isOpenStatus(normalizeBookingStatus(item.status)),
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 max-w-xl border border-rule dark:border-white/10">
      <div className="flex items-end justify-between gap-3 border-b border-rule px-4 py-3 dark:border-white/10">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Otvorené lístky
          </p>
          <p className="mt-1 font-display text-2xl text-ink">
            {items.length}{" "}
            <span className="font-sans text-sm font-normal text-muted-foreground">
              na tomto titule
            </span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-none border-ink"
          render={<Link href={`/bookings?book=${bookId}`} />}
        >
          Pult
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      </div>
      <ul className="divide-y divide-rule dark:divide-white/10">
        {items.map((item) => {
          const status = normalizeBookingStatus(item.status) as BookingStatusCode;
          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {item.borrowerName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.borrowerEmail}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "font-display text-xs tracking-[0.14em] uppercase",
                    status === BOOKING_STATUS.overdue
                      ? "text-stair-2"
                      : "text-ink",
                  )}
                >
                  {BOOKING_STATUS_LABEL[status]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDeskDate(item.dueDate)} · {duePhrase(item.dueDate, status)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

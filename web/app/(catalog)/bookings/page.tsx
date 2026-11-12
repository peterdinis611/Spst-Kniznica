import { Suspense } from "react";
import { BookingsDesk } from "@/components/catalog/BookingsDesk";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { searchBookingsAction } from "@/lib/bookings";
import { searchBooksAction } from "@/lib/catalog/actions";

export const metadata = {
  title: "Výpožičky",
};

async function BookingsContent({
  searchParams,
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  const { book } = await searchParams;
  const bookId = book?.trim() || undefined;
  const [bookingsResult, booksResult] = await Promise.all([
    searchBookingsAction({ page: 1, pageSize: 40, bookId }),
    searchBooksAction({ page: 1, pageSize: 100 }),
  ]);

  const catalog = (booksResult?.data?.items ?? []).map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
  }));

  return (
    <BookingsDesk
      initialBookings={bookingsResult?.data?.items ?? []}
      initialTotal={bookingsResult?.data?.totalCount ?? 0}
      catalog={catalog}
    />
  );
}

export default function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={4} />}>
        <BookingsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

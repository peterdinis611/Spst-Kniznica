import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { MyLibrary } from "@/components/catalog/MyLibrary";
import { searchBooksAction } from "@/lib/catalog/actions";
import { searchBookingsAction } from "@/lib/bookings";

export const metadata: Metadata = {
  title: "Moja knižnica",
  description: "Tvoje výpožičky, termíny, história a čakací zoznam.",
  alternates: { canonical: "/library" },
};

async function LibraryContent() {
  await connection();
  const [bookingsResult, booksResult] = await Promise.all([
    searchBookingsAction({ page: 1, pageSize: 100 }),
    searchBooksAction({ page: 1, pageSize: 100 }),
  ]);

  const catalog = (booksResult?.data?.items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    author: item.author,
  }));

  return (
    <MyLibrary
      initialBookings={bookingsResult?.data?.items ?? []}
      catalog={catalog}
    />
  );
}

export default function LibraryPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton />}>
        <LibraryContent />
      </Suspense>
    </main>
  );
}

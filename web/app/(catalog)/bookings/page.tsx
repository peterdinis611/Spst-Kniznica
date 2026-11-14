import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { BookingsAccessGate } from "@/components/catalog/BookingsAccessGate";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { searchBooksAction } from "@/lib/catalog/actions";

export const metadata: Metadata = {
  title: "Výpožičný pult",
  description:
    "Rezervácie, aktívne výpožičky a vrátenia — pult SPST Knižnice pre čitateľov a službu.",
  alternates: { canonical: "/bookings" },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Výpožičný pult",
    description:
      "Rezervácie, aktívne výpožičky a vrátenia — pult SPST Knižnice.",
    url: "/bookings",
  },
};

async function BookingsContent() {
  await connection();
  const booksResult = await searchBooksAction({ page: 1, pageSize: 100 });

  const catalog = (booksResult?.data?.items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    author: item.author,
  }));

  return <BookingsAccessGate catalog={catalog} />;
}

export default function BookingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={4} />}>
        <BookingsContent />
      </Suspense>
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { DeskDailyBoard } from "@/components/catalog/DeskDailyBoard";
import { searchBooksAction } from "@/lib/catalog/actions";

export const metadata: Metadata = {
  title: "Denná tabuľa",
  description: "Overdue, due soon a rezervácie na vyzdvihnutie — pult knihovníka.",
  alternates: { canonical: "/desk" },
  robots: { index: false, follow: false },
};

async function DeskContent() {
  await connection();
  const booksResult = await searchBooksAction({ page: 1, pageSize: 100 });
  const catalog = (booksResult?.data?.items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    author: item.author,
  }));
  return <DeskDailyBoard catalog={catalog} />;
}

export default function DeskPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton />}>
        <DeskContent />
      </Suspense>
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { DeskDailyBoard } from "@/components/catalog/DeskDailyBoard";
import { loadCatalogRefs } from "@/lib/catalog/load-catalog-refs";

export const metadata: Metadata = {
  title: "Denná tabuľa",
  description:
    "Po termíne, blížiace sa termíny a rezervácie na vyzdvihnutie — pult knihovníka.",
  alternates: { canonical: "/desk" },
  robots: { index: false, follow: false },
};

async function DeskContent() {
  await connection();
  const catalog = await loadCatalogRefs();
  return <DeskDailyBoard catalog={catalog} />;
}

export default function DeskPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton />}>
        <DeskContent />
      </Suspense>
    </div>
  );
}

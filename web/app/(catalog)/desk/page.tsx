import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { DeskDailyBoard } from "@/components/catalog/DeskDailyBoard";

export const metadata: Metadata = {
  title: "Denná tabuľa",
  description:
    "Po termíne, blížiace sa termíny a rezervácie na vyzdvihnutie — pult knihovníka.",
  alternates: { canonical: "/desk" },
  robots: { index: false, follow: false },
};

export default function DeskPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={5} variant="desk" />}>
        <DeskDailyBoard />
      </Suspense>
    </div>
  );
}

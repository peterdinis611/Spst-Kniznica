import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingsAccessGate } from "@/components/catalog/BookingsAccessGate";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Výpožičný pult",
  description:
    "Rezervácie, aktívne výpožičky a vrátenia — pult SPST Knižnice pre čitateľov a službu.",
  path: "/bookings",
  noIndex: true,
});

export default function BookingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={5} variant="desk" />}>
        <BookingsAccessGate />
      </Suspense>
    </div>
  );
}

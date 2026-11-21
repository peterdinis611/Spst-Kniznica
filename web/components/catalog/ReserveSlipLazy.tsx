"use client";

import dynamic from "next/dynamic";

const ReserveSlip = dynamic(
  () =>
    import("@/components/catalog/ReserveSlip").then((mod) => ({
      default: mod.ReserveSlip,
    })),
  {
    loading: () => (
      <div
        className="min-h-48 animate-pulse rounded-none bg-muted/40"
        aria-hidden
      />
    ),
  },
);

export function ReserveSlipLazy({
  bookId,
  title,
  available,
}: {
  bookId: string;
  title: string;
  available: boolean;
}) {
  return <ReserveSlip bookId={bookId} title={title} available={available} />;
}

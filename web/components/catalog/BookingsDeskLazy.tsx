"use client";

import dynamic from "next/dynamic";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export const BookingsDeskLazy = dynamic(
  () =>
    import("@/components/catalog/BookingsDesk").then((mod) => ({
      default: mod.BookingsDesk,
    })),
  {
    loading: () => <CatalogSkeleton rows={4} />,
  },
);

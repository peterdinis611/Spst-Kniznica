"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function BookDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Knihu sa nepodarilo otvoriť"
      description="Detail knihy nie je dostupný. Skús to znova, alebo sa vráť do katalógu."
      homeHref="/books"
    />
  );
}

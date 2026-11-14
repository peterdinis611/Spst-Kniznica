"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function CategoryDetailError({
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
      title="Kategóriu sa nepodarilo otvoriť"
      description="Detail kategórie nie je dostupný. Skús to znova, alebo sa vráť do zoznamu."
      homeHref="/categories"
    />
  );
}

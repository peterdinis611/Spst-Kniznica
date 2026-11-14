"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function AuthorDetailError({
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
      title="Autora sa nepodarilo otvoriť"
      description="Detail autora nie je dostupný. Skús to znova, alebo sa vráť do zoznamu."
      homeHref="/authors"
    />
  );
}

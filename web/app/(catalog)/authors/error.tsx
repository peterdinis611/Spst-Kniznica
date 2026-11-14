"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function AuthorsError({
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
      title="Autori nedostupní"
      description="Zoznam autorov sa nepodarilo načítať. Skús to znova — Author služba môže byť dočasne offline."
      homeHref="/authors"
    />
  );
}

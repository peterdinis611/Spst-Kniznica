"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function BooksError({
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
      title="Katalóg kníh nedostupný"
      description="Zoznam kníh sa nepodarilo načítať. Skús to znova — Book služba môže byť dočasne offline."
      homeHref="/books"
    />
  );
}

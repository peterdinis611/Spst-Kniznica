"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function CatalogError({
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
      title="Katalóg nedostupný"
      description="Zoznam sa nepodarilo načítať. Skús to znova — služby kníh, autorov alebo kategórií môžu byť dočasne offline."
      homeHref="/books"
    />
  );
}

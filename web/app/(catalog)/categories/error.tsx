"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function CategoriesError({
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
      title="Kategórie nedostupné"
      description="Zoznam kategórií sa nepodarilo načítať. Skús to znova — Category služba môže byť dočasne offline."
      homeHref="/categories"
    />
  );
}
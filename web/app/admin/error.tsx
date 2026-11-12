"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function AdminError({
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
      title="Admin panel nedostupný"
      description="Administráciu sa nepodarilo načítať. Over prihlásenie a skús to znova."
      homeHref="/admin"
    />
  );
}

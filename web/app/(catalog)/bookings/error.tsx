"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function BookingsError({
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
      title="Rezervácie nedostupné"
      description="Zoznam rezervácií sa nepodarilo načítať. Over prihlásenie a skús to znova."
      homeHref="/bookings"
    />
  );
}

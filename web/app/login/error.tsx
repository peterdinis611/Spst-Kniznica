"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function LoginError({
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
      title="Prihlásenie zlyhalo"
      description="Prihlasovaciu stránku sa nepodarilo načítať. Skús to znova."
      homeHref="/login"
    />
  );
}

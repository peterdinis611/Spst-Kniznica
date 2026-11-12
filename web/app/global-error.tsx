"use client";

import { RouteError } from "@/components/routing/RouteError";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sk">
      <body className="min-h-dvh bg-[#f7f3ea] text-[#0e1a24] antialiased">
        <RouteError
          error={error}
          reset={reset}
          title="Kritická chyba"
          description="Aplikáciu sa nepodarilo obnoviť. Skús to znova; ak problém pretrváva, obnov stránku."
        />
      </body>
    </html>
  );
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  HttpStatusPageShell,
  HttpStatusPanel,
} from "@/components/routing/HttpStatusPanel";

function Status401Inner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const loginHref =
    next && next.startsWith("/") && !next.startsWith("//")
      ? `/login?next=${encodeURIComponent(next)}`
      : "/login";

  return <HttpStatusPanel code={401} primaryHref={loginHref} />;
}

export function Status401Page() {
  return (
    <HttpStatusPageShell>
      <Suspense fallback={<HttpStatusPanel code={401} />}>
        <Status401Inner />
      </Suspense>
    </HttpStatusPageShell>
  );
}

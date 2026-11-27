"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  HttpStatusPageShell,
  HttpStatusPanel,
} from "@/components/routing/HttpStatusPanel";
import { safeNextPath } from "@/lib/routing/safe-next-path";

function Status401Inner() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const loginHref = next
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

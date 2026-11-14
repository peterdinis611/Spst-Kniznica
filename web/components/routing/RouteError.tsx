"use client";

import { useEffect } from "react";
import {
  HttpStatusPageShell,
  HttpStatusPanel,
} from "@/components/routing/HttpStatusPanel";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
};

export function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error("[route-error]", error.digest ?? error.name, error.message);
  }, [error]);

  return (
    <HttpStatusPageShell>
      <HttpStatusPanel code={500} onRetry={reset} retryLabel="Skúsiť znova" />
    </HttpStatusPageShell>
  );
}

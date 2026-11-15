"use client";

import { useEffect } from "react";
import {
  HttpStatusPageShell,
  HttpStatusPanel,
} from "@/components/routing/HttpStatusPanel";
import {
  isHttpStatusCode,
  type HttpStatusCode,
} from "@/lib/routing/http-status";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
};

function statusFromError(error: Error): HttpStatusCode {
  const match = error.message.match(/\bAPI\s+(401|404|500|502|503)\b/i)
    ?? error.message.match(/\b(401|404|500|502|503)\b/);
  if (!match?.[1]) return 500;
  const code = Number(match[1]);
  return isHttpStatusCode(code) ? code : 500;
}

export function RouteError({
  error,
  reset,
  title,
  description,
  homeHref,
}: RouteErrorProps) {
  const code = statusFromError(error);

  useEffect(() => {
    if (code === 500) {
      console.error("[route-error]", error.digest ?? error.name, error.message);
    }
  }, [error, code]);

  return (
    <HttpStatusPageShell>
      <HttpStatusPanel
        code={code}
        title={title}
        description={description}
        homeHref={homeHref}
        onRetry={reset}
        retryLabel="Skúsiť znova"
      />
    </HttpStatusPageShell>
  );
}

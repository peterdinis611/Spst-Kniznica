"use client";

import { HttpStatusPanel } from "@/components/routing/HttpStatusPanel";

/** @deprecated Prefer HttpStatusPanel code={404} */
export function NotFoundPanel({ className }: { className?: string }) {
  return <HttpStatusPanel code={404} className={className} />;
}

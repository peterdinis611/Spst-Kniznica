import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HTTP_STATUS_COPY } from "@/lib/routing/http-status";

const copy = HTTP_STATUS_COPY[404];

export const metadata: Metadata = {
  title: `${copy.code} · ${copy.title}`,
  description: copy.description,
  robots: { index: false, follow: false },
};

/** Canonical 404 UI is `not-found.tsx`; this route triggers it. */
export default function NotFoundAliasPage() {
  notFound();
}

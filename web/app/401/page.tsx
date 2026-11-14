import type { Metadata } from "next";
import { Status401Page } from "@/components/routing/Status401Client";
import { HTTP_STATUS_COPY } from "@/lib/routing/http-status";

const copy = HTTP_STATUS_COPY[401];

export const metadata: Metadata = {
  title: `${copy.code} · ${copy.title}`,
  description: copy.description,
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return <Status401Page />;
}

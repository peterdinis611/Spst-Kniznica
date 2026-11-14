import type { Metadata } from "next";
import {
  HttpStatusPageShell,
  HttpStatusPanel,
} from "@/components/routing/HttpStatusPanel";
import { HTTP_STATUS_COPY } from "@/lib/routing/http-status";

const copy = HTTP_STATUS_COPY[503];

export const metadata: Metadata = {
  title: `${copy.code} · ${copy.title}`,
  description: copy.description,
  robots: { index: false, follow: false },
};

export default function ServiceUnavailablePage() {
  return (
    <HttpStatusPageShell>
      <HttpStatusPanel code={503} />
    </HttpStatusPageShell>
  );
}

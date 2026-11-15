import Link from "next/link";
import { MAIN_CONTENT_ID } from "@/lib/a11y/ids";

export function SkipToContent() {
  return (
    <Link href={`#${MAIN_CONTENT_ID}`} className="skip-to-content">
      Preskočiť na obsah
    </Link>
  );
}

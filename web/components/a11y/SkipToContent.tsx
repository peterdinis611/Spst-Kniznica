import { MAIN_CONTENT_ID } from "@/lib/a11y/ids";

export function SkipToContent() {
  return (
    <a href={`#${MAIN_CONTENT_ID}`} className="skip-to-content">
      Preskočiť na obsah
    </a>
  );
}

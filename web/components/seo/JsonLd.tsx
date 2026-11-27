import type { JsonLd as JsonLdValue } from "@/lib/seo/json-ld";
import { serializeJsonLd } from "@/lib/seo/serialize-json-ld";

export function JsonLd({ data }: { data: JsonLdValue | JsonLdValue[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

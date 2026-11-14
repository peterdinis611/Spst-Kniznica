import { renderOg, ogContentType, ogSize } from "@/lib/og/render";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.name;
export const size = ogSize;
export const contentType = ogContentType;

export default function OpenGraphImage() {
  return renderOg({
    variant: "list",
    eyebrow: "Školský fond",
    title: "SPST Knižnica",
    description: siteConfig.description,
  });
}

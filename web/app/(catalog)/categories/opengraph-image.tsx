import { renderOg, ogContentType, ogSize } from "@/lib/og/render";

export const alt = "Kategórie · SPST Knižnica";
export const size = ogSize;
export const contentType = ogContentType;

export default function CategoriesOpenGraphImage() {
  return renderOg({
    variant: "list",
    eyebrow: "Katalóg",
    title: "Kategórie",
    description:
      "Tematické rady školskej knižnice — nájdi správnu poličku rýchlejšie.",
    footerRight: "kategorie · katalog",
  });
}

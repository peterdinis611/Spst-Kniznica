import { renderOg, ogContentType, ogSize } from "@/lib/og/render";

export const alt = "Katalóg kníh · SPST Knižnica";
export const size = ogSize;
export const contentType = ogContentType;

export default function BooksOpenGraphImage() {
  return renderOg({
    variant: "list",
    eyebrow: "Katalóg",
    title: "Knihy",
    description:
      "Prehľad školského fondu — hľadaj podľa názvu, autora alebo kategórie.",
    footerRight: "knihy · rezervácie",
  });
}

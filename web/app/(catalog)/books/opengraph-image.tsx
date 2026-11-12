import { ImageResponse } from "next/og";
import { OgFrame } from "@/lib/og/frame";
import { ogSize } from "@/lib/og/theme";

export const alt = "Katalóg kníh · SPST Knižnica";
export const size = ogSize;
export const contentType = "image/png";

export default function BooksOpenGraphImage() {
  return new ImageResponse(
    (
      <OgFrame
        eyebrow="Katalóg"
        title="Knihy"
        description="Prehľad školského fondu — hľadaj podľa názvu, autora alebo kategórie."
        footerRight="knihy · rezervácie"
      />
    ),
    { ...ogSize },
  );
}

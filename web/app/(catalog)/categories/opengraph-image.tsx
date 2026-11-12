import { ImageResponse } from "next/og";
import { OgFrame } from "@/lib/og/frame";
import { ogSize } from "@/lib/og/theme";

export const alt = "Kategórie · SPST Knižnica";
export const size = ogSize;
export const contentType = "image/png";

export default function CategoriesOpenGraphImage() {
  return new ImageResponse(
    (
      <OgFrame
        eyebrow="Katalóg"
        title="Kategórie"
        description="Tematické rady školskej knižnice — nájdi správnu poličku rýchlejšie."
        footerRight="kategorie · katalog"
      />
    ),
    { ...ogSize },
  );
}

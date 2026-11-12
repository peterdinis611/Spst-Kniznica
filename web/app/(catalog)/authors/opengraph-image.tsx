import { ImageResponse } from "next/og";
import { OgFrame } from "@/lib/og/frame";
import { ogSize } from "@/lib/og/theme";

export const alt = "Autori · SPST Knižnica";
export const size = ogSize;
export const contentType = "image/png";

export default function AuthorsOpenGraphImage() {
  return new ImageResponse(
    (
      <OgFrame
        eyebrow="Katalóg"
        title="Autori"
        description="Zoznam autorov v školskom fonde SPST — od klasiky po odbornú literatúru."
        footerRight="autori · katalog"
      />
    ),
    { ...ogSize },
  );
}

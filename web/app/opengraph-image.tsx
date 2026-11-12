import { ImageResponse } from "next/og";
import { OgFrame } from "@/lib/og/frame";
import { ogSize } from "@/lib/og/theme";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.name;
export const size = ogSize;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <OgFrame
        eyebrow="Školský fond"
        title="SPST Knižnica"
        description={siteConfig.description}
      />
    ),
    { ...ogSize },
  );
}

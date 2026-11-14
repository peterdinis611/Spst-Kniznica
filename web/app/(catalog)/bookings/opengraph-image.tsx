import { renderOg, ogContentType, ogSize } from "@/lib/og/render";

export const alt = "Výpožičný pult · SPST Knižnica";
export const size = ogSize;
export const contentType = ogContentType;

export default function BookingsOpenGraphImage() {
  return renderOg({
    variant: "list",
    eyebrow: "Služba",
    title: "Výpožičný pult",
    description:
      "Rezervácie, aktívne výpožičky a vrátenia — pult SPST Knižnice.",
    footerRight: "vypozicky · staff",
  });
}

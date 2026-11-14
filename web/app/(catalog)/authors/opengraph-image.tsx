import { renderOg, ogContentType, ogSize } from "@/lib/og/render";

export const alt = "Autori · SPST Knižnica";
export const size = ogSize;
export const contentType = ogContentType;

export default function AuthorsOpenGraphImage() {
  return renderOg({
    variant: "list",
    eyebrow: "Katalóg",
    title: "Autori",
    description:
      "Zoznam autorov v školskom fonde SPST — od klasiky po odbornú literatúru.",
    footerRight: "autori · katalog",
  });
}

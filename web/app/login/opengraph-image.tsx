import { renderOg, ogContentType, ogSize } from "@/lib/og/render";

export const alt = "Prihlásenie · SPST Knižnica";
export const size = ogSize;
export const contentType = ogContentType;

export default function LoginOpenGraphImage() {
  return renderOg({
    variant: "list",
    eyebrow: "Účet",
    title: "Prihlásenie",
    description:
      "Prihlásenie do SPST Knižnica cez školský Microsoft Entra účet.",
    footerRight: "login · entra",
  });
}

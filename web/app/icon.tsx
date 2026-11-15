import { ImageResponse } from "next/og";
import { IconMark } from "@/lib/brand/icon-mark";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<IconMark size={192} />, { ...size });
}

import { ImageResponse } from "next/og";
import { OgFrame, type OgFrameProps } from "./frame";
import { loadOgFonts } from "./fonts";
import { ogContentType, ogSize } from "./theme";

export { ogContentType, ogSize };
export type { OgFrameProps } from "./frame";

export function truncateOg(text: string, max = 72): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function clipOgDescription(text: string, max = 168): string {
  return truncateOg(text, max);
}

/** Shared `ImageResponse` for all opengraph-image routes. */
export async function renderOg(props: OgFrameProps): Promise<ImageResponse> {
  const fonts = await loadOgFonts();

  return new ImageResponse(<OgFrame {...props} />, {
    ...ogSize,
    fonts: fonts.length > 0 ? fonts : undefined,
  });
}

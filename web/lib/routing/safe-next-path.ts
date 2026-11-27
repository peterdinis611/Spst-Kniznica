/**
 * Same-origin relative path for post-login redirects.
 * Blocks protocol-relative (`//evil`) and absolute URLs.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.includes("\\") || raw.includes("\0")) return null;
  return raw;
}

/** Absolute http(s) only — blocks javascript:/data:/protocol-relative abuse in img/href sinks. */
export function isSafeHttpUrl(
  value: string | null | undefined,
  options?: { allowHttp?: boolean },
): boolean {
  const raw = value?.trim();
  if (!raw) return false;

  try {
    const url = new URL(raw);
    if (url.protocol === "https:") return true;
    if (options?.allowHttp !== false && url.protocol === "http:") return true;
    return false;
  } catch {
    return false;
  }
}

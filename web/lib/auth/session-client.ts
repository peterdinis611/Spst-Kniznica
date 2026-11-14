"use client";

/** Sync Entra access token into HttpOnly BFF cookie (same-origin only). */
export async function syncBrowserSession(
  accessToken: string | null | undefined,
): Promise<void> {
  if (typeof window === "undefined") return;

  if (accessToken?.trim()) {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ accessToken: accessToken.trim() }),
    });
    return;
  }

  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "same-origin",
  });
}

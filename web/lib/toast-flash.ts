/**
 * Flash toasts that survive full-page redirects (MSAL logoutRedirect).
 * Queue before navigation; ToastFlashListener plays them after mount.
 */

export type ToastFlashKind = "success" | "error" | "warning" | "info" | "library";

export type ToastFlashPayload = {
  kind: ToastFlashKind;
  title: string;
  description?: string;
  iconName?: string;
};

const STORAGE_KEY = "spst.toast.flash";

export function queueToastFlash(payload: ToastFlashPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // private mode / quota — ignore
  }
}

export function consumeToastFlash(): ToastFlashPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as ToastFlashPayload;
    if (!parsed?.kind || !parsed?.title) return null;
    return parsed;
  } catch {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

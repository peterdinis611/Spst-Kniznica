/**
 * DevAuth (Entra:Enabled=false) has no real IdP session — /api/auth/me always
 * returns the synthetic principal. Track explicit sign-out in sessionStorage
 * so refresh does not auto-login again until the user clicks login.
 */

const SIGNED_OUT_KEY = "spst.devauth.signedOut";

export function isDevAuthSignedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SIGNED_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDevAuthSignedOut(signedOut: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (signedOut) {
      window.sessionStorage.setItem(SIGNED_OUT_KEY, "1");
    } else {
      window.sessionStorage.removeItem(SIGNED_OUT_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

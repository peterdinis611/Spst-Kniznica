const ADMIN_OPS_CHANGED = "spst:admin-ops-changed";

/** Broadcast that catalog/booking aggregates may be stale (CRUD / side-channel). */
export function notifyAdminOpsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_OPS_CHANGED));
}

export function subscribeAdminOpsChanged(handler: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  window.addEventListener(ADMIN_OPS_CHANGED, handler);
  return () => window.removeEventListener(ADMIN_OPS_CHANGED, handler);
}

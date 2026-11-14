/** HttpOnly cookie with Entra access token (BFF). Middleware only checks presence. */
export const SESSION_COOKIE = "spst_at";

export const SESSION_MAX_AGE_SECONDS = 60 * 60; // 1h — align with typical Entra AT lifetime

export const UNAUTHORIZED_EVENT = "spst:unauthorized";

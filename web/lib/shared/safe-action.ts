import { createSafeActionClient } from "next-safe-action";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isApiHttpError } from "@/lib/api/errors";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    // Let Next.js navigation (redirect to /502 etc.) propagate.
    if (isRedirectError(error)) {
      throw error;
    }

    // Expected gateway / auth / throttle failures — surface as action error, not overlay.
    if (
      isApiHttpError(error) &&
      [401, 404, 429, 502, 503].includes(error.status)
    ) {
      return error.message;
    }

    console.error("[safe-action]", error);
    return error instanceof Error ? error.message : "Niečo sa pokazilo.";
  },
});

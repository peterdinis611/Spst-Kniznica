import { ApiHttpError } from "@/lib/api/errors";

/**
 * Parse response body text as JSON without trusting the shape at runtime.
 * Callers still assert/narrow to T at the API boundary.
 */
export function parseJsonText<T>(
  text: string,
  path: string,
  emptyValue?: T,
): T {
  if (!text) {
    return emptyValue as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiHttpError(502, path, `API invalid JSON: ${path}`);
  }
}

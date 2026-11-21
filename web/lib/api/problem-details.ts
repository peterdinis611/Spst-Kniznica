/** ASP.NET ProblemDetails-ish error payload (plus validation errors). */
export type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
  type?: string;
  errors?: Record<string, string[] | string>;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseProblemDetails(text: string): ProblemDetails | null {
  if (!text.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return null;
    const errorsRaw = parsed.errors;
    const errors =
      isRecord(errorsRaw)
        ? (errorsRaw as Record<string, string[] | string>)
        : undefined;
    return {
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      detail: typeof parsed.detail === "string" ? parsed.detail : undefined,
      status: typeof parsed.status === "number" ? parsed.status : undefined,
      type: typeof parsed.type === "string" ? parsed.type : undefined,
      errors,
    };
  } catch {
    return null;
  }
}

/** Prefer first validation message, then detail, then title. */
export function messageFromProblemDetails(
  body: ProblemDetails | null,
  fallback: string,
): string {
  if (!body) return fallback;
  if (body.errors) {
    for (const value of Object.values(body.errors)) {
      const message = Array.isArray(value) ? value[0] : value;
      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }
    }
  }
  if (body.detail?.trim() && body.detail !== body.title) {
    return body.detail.trim();
  }
  if (body.title?.trim()) {
    return body.title.trim();
  }
  return fallback;
}

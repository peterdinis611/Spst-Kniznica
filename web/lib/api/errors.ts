export class ApiHttpError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string, message: string) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.path = path;
  }
}

export function isApiHttpError(error: unknown): error is ApiHttpError {
  return error instanceof ApiHttpError;
}

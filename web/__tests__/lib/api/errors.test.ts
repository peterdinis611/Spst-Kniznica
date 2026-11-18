import { describe, expect, it } from "vitest";
import { ApiHttpError, isApiHttpError } from "@/lib/api/errors";

describe("ApiHttpError", () => {
  it("stores status path and message", () => {
    const err = new ApiHttpError(404, "/api/books/1", "Not found");
    expect(err.name).toBe("ApiHttpError");
    expect(err.status).toBe(404);
    expect(err.path).toBe("/api/books/1");
    expect(err.message).toBe("Not found");
  });
});

describe("isApiHttpError", () => {
  it("narrows ApiHttpError instances", () => {
    expect(isApiHttpError(new ApiHttpError(500, "/x", "boom"))).toBe(true);
    expect(isApiHttpError(new Error("nope"))).toBe(false);
    expect(isApiHttpError({ status: 500 })).toBe(false);
    expect(isApiHttpError(null)).toBe(false);
  });
});

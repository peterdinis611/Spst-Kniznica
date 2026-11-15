import { describe, expect, it } from "vitest";
import {
  HTTP_STATUS_COPY,
  isHttpStatusCode,
} from "@/lib/routing/http-status";

describe("isHttpStatusCode", () => {
  it("accepts known status codes", () => {
    for (const code of [401, 404, 500, 502, 503] as const) {
      expect(isHttpStatusCode(code)).toBe(true);
    }
  });

  it("rejects other numbers", () => {
    expect(isHttpStatusCode(200)).toBe(false);
    expect(isHttpStatusCode(418)).toBe(false);
  });
});

describe("HTTP_STATUS_COPY", () => {
  it("has Slovak copy and at least one primary action", () => {
    for (const code of [401, 404, 500, 502, 503] as const) {
      const copy = HTTP_STATUS_COPY[code];
      expect(copy.code).toBe(code);
      expect(copy.title.length).toBeGreaterThan(3);
      expect(copy.description.length).toBeGreaterThan(10);
      expect(copy.actions.some((a) => a.primary)).toBe(true);
      expect(copy.eyebrow).toContain(String(code));
    }
  });

  it("points 401 to login", () => {
    expect(HTTP_STATUS_COPY[401].actions[0]).toMatchObject({
      href: "/login",
      primary: true,
    });
  });
});

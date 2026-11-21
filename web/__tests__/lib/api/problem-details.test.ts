import { describe, expect, it } from "vitest";
import {
  messageFromProblemDetails,
  parseProblemDetails,
} from "@/lib/api/problem-details";

describe("problem-details", () => {
  it("parses detail/title and validation errors", () => {
    const body = parseProblemDetails(
      JSON.stringify({
        title: "Validation",
        detail: "One or more errors",
        errors: { email: ["Neplatný e-mail"] },
      }),
    );
    expect(body?.title).toBe("Validation");
    expect(messageFromProblemDetails(body, "fallback")).toBe("Neplatný e-mail");
  });

  it("returns null for non-json", () => {
    expect(parseProblemDetails("not-json")).toBeNull();
  });
});

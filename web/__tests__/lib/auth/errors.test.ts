import { describe, expect, it } from "vitest";
import { formatAuthError } from "@/lib/auth/errors";

describe("formatAuthError", () => {
  it("returns original message when unrelated", () => {
    expect(formatAuthError("Network down")).toBe("Network down");
  });

  it("appends scope hint for missing access_as_user", () => {
    const message = formatAuthError(
      "AADSTS65005: The scope 'access_as_user' doesn't exist",
    );
    expect(message).toContain("AADSTS65005");
    expect(message).toContain("access_as_user");
    expect(message).toContain("Entra");
  });

  it("hints Application ID URI for invalid resource", () => {
    const message = formatAuthError(
      "AADSTS500011: The resource principal named api://x was not found",
    );
    expect(message).toContain("api://");
    expect(message).toContain("Application ID URI");
  });
});

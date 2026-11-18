import { describe, expect, it } from "vitest";
import type { AccountInfo } from "@azure/msal-browser";
import { resolveUserDisplayName } from "@/lib/auth/display-name";

function account(
  name: string | undefined,
  claims: Record<string, unknown>,
): AccountInfo {
  return {
    homeAccountId: "1",
    environment: "login.microsoftonline.com",
    tenantId: "t",
    username: "u@spst.sk",
    localAccountId: "1",
    name,
    idTokenClaims: claims,
  } as AccountInfo;
}

describe("resolveUserDisplayName", () => {
  it("prefers longer given+family over short API name", () => {
    expect(
      resolveUserDisplayName(
        { name: "P." },
        account("P.", { given_name: "Peter", family_name: "Dinis" }),
      ),
    ).toBe("Peter Dinis");
  });

  it("falls back to Účet when nothing is available", () => {
    expect(resolveUserDisplayName(null, null)).toBe("Účet");
  });

  it("uses account name when claims missing", () => {
    expect(
      resolveUserDisplayName({ name: "API" }, account("MSAL Name", {})),
    ).toBe("MSAL Name");
  });
});

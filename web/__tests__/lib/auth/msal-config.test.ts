import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMsalConfig, resolveApiScope } from "@/lib/auth/config";
import type { AuthConfig } from "@/lib/auth/types";

const base: AuthConfig = {
  enabled: true,
  tenantId: "",
  clientId: "client-from-api",
  audience: "",
  apiScope: "api://client-from-api/access_as_user",
  authority: "https://login.microsoftonline.com/tenant-from-api",
  redirectUriHint: "http://localhost:3000/login",
  loginNotice: null,
  hasLoginNotice: false,
  knownRoles: ["Reader", "Librarian", "Admin"],
};

describe("buildMsalConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers authority from public config when tenantId is redacted", () => {
    const cfg = buildMsalConfig(base);
    expect(cfg.auth.clientId).toBe("client-from-api");
    expect(cfg.auth.authority).toBe(
      "https://login.microsoftonline.com/tenant-from-api",
    );
    expect(cfg.cache?.cacheLocation).toBe("sessionStorage");
  });

  it("allows NEXT_PUBLIC overrides", () => {
    vi.stubEnv("NEXT_PUBLIC_AZURE_CLIENT_ID", "env-client");
    vi.stubEnv(
      "NEXT_PUBLIC_AZURE_AUTHORITY",
      "https://login.microsoftonline.com/env-tenant",
    );
    const cfg = buildMsalConfig(base);
    expect(cfg.auth.clientId).toBe("env-client");
    expect(cfg.auth.authority).toContain("env-tenant");
  });
});

describe("resolveApiScope", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses apiScope from config", () => {
    expect(resolveApiScope(base)).toBe("api://client-from-api/access_as_user");
  });

  it("falls back to clientId-derived scope", () => {
    expect(
      resolveApiScope({
        ...base,
        apiScope: "",
        clientId: "abc",
      }),
    ).toBe("api://abc/access_as_user");
  });
});

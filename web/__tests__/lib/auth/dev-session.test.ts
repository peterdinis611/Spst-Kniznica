import { afterEach, describe, expect, it } from "vitest";
import {
  isDevAuthSignedOut,
  setDevAuthSignedOut,
} from "@/lib/auth/dev-session";

describe("dev-session", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("defaults to signed in (not signed out)", () => {
    expect(isDevAuthSignedOut()).toBe(false);
  });

  it("persists signed-out across reads", () => {
    setDevAuthSignedOut(true);
    expect(isDevAuthSignedOut()).toBe(true);
    setDevAuthSignedOut(false);
    expect(isDevAuthSignedOut()).toBe(false);
  });
});

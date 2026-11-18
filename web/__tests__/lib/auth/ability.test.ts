import { describe, expect, it } from "vitest";
import { defineAbilityFor } from "@/lib/auth/ability";
import type { AuthUser } from "@/lib/auth/types";

const baseUser: AuthUser = {
  id: "1",
  name: "Test",
  email: "test@spst.sk",
  roles: [],
  isAuthenticated: true,
  isStaff: false,
  isAdmin: false,
};

describe("defineAbilityFor", () => {
  it("denies bookings for guests", () => {
    const ability = defineAbilityFor(null);
    expect(ability.can("access", "BookingsPage")).toBe(false);
    expect(ability.can("manage", "BookingsDesk")).toBe(false);
  });

  it("allows readers to access bookings but not manage desk", () => {
    const ability = defineAbilityFor({
      ...baseUser,
      roles: ["Reader"],
    });
    expect(ability.can("access", "BookingsPage")).toBe(true);
    expect(ability.can("manage", "BookingsDesk")).toBe(false);
  });

  it("allows staff to manage desk", () => {
    const ability = defineAbilityFor({
      ...baseUser,
      roles: ["Librarian"],
      isStaff: true,
    });
    expect(ability.can("manage", "BookingsDesk")).toBe(true);
    expect(ability.can("access", "AdminPage")).toBe(true);
  });

  it("gives librarian AdminPage access but not manage", () => {
    const ability = defineAbilityFor({
      ...baseUser,
      roles: ["Librarian"],
      isStaff: true,
      isAdmin: false,
    });
    expect(ability.can("access", "AdminPage")).toBe(true);
    expect(ability.can("manage", "AdminPage")).toBe(false);
  });

  it("gives admin manage on AdminPage", () => {
    const ability = defineAbilityFor({
      ...baseUser,
      roles: ["Admin"],
      isStaff: true,
      isAdmin: true,
    });
    expect(ability.can("access", "AdminPage")).toBe(true);
    expect(ability.can("manage", "AdminPage")).toBe(true);
  });
});

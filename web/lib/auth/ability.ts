import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";
import { AppRoles } from "@/lib/auth/app-roles";
import type { AuthUser } from "@/lib/auth/types";

export type AuthAction = "access" | "read" | "manage";
export type AuthSubject = "BookingsPage" | "BookingsDesk" | "AdminPage";

export type AppAbility = MongoAbility<[AuthAction, AuthSubject]>;

function hasStaffRole(user: AuthUser): boolean {
  return user.roles.some(
    (role) =>
      role.toLowerCase() === AppRoles.librarian.toLowerCase() ||
      role.toLowerCase() === AppRoles.admin.toLowerCase(),
  );
}

export function defineAbilityFor(user: AuthUser | null): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (!user?.isAuthenticated) {
    return build();
  }

  can("access", "BookingsPage");
  can("read", "BookingsPage");

  if (hasStaffRole(user) || user.isStaff) {
    can("manage", "BookingsDesk");
  }

  if (user.isAdmin || user.roles.some((r) => r.toLowerCase() === "admin")) {
    can("access", "AdminPage");
    can("manage", "AdminPage");
  } else if (hasStaffRole(user) || user.isStaff) {
    can("access", "AdminPage");
  }

  return build();
}

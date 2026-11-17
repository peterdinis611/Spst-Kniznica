/** react-admin getPermissions returns AuthUser roles (string[]). */
export function hasAdminRole(permissions: unknown): boolean {
  if (!Array.isArray(permissions)) return false;
  return permissions.some(
    (role) => typeof role === "string" && role.toLowerCase() === "admin",
  );
}

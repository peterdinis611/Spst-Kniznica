export const AppRoles = {
  reader: "Reader",
  librarian: "Librarian",
  admin: "Admin",
} as const;

export type AppRole = (typeof AppRoles)[keyof typeof AppRoles];

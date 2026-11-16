export type AuthConfig = {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  audience: string;
  apiScope: string;
  authority: string;
  redirectUriHint: string;
  loginNotice?: string | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
  roles: string[];
  isAuthenticated: boolean;
  isStaff: boolean;
  isAdmin: boolean;
};

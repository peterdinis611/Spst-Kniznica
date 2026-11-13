# Microsoft Entra ID — SPST Knižnica

App registration: **Spst-Kniznica**

| Položka | Hodnota |
|---------|---------|
| Application (client) ID | `e180d2c3-d176-44f5-9d1e-2c5e01f182f9` |
| Directory (tenant) ID | `3cd05ac6-46c1-4798-9df3-062237bfdcc4` |
| Object ID | `9907b816-0e90-42c8-b67e-7368eebb7272` |
| Redirect URI (SPA) | `http://localhost:3000/login` |
| Audience | `api://e180d2c3-d176-44f5-9d1e-2c5e01f182f9` |
| Scope | `api://e180d2c3-d176-44f5-9d1e-2c5e01f182f9/access_as_user` |

Lokálne sú hodnoty v:

- `web/.env.local`
- `src/AuthService/appsettings.Development.json` (`Entra:Enabled=true`)
- `src/AdminService/appsettings.Development.json` (`Entra:Enabled=true`)

## Dokončiť v Azure portáli (povinné)

Bez týchto krokov MSAL nedostane token s audience pre AuthService.

### 1. Expose an API (scope `access_as_user`)

**Automaticky (odporúčané):**

```bash
brew install azure-cli jq   # ak chýbajú
az login --use-device-code --tenant 3cd05ac6-46c1-4798-9df3-062237bfdcc4
./scripts/entra-expose-scope.sh
```

**Ručne v portáli:** App registration → [Expose an API](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/ProtectAnAPI/appId/e180d2c3-d176-44f5-9d1e-2c5e01f182f9/isMSAApp~/false)

1. **Application ID URI** → `api://e180d2c3-d176-44f5-9d1e-2c5e01f182f9` → Save
2. **Add a scope** → name: `access_as_user`, consent: Admins and users, State: Enabled

### 2. API permissions (na tom istom app registration)

1. **API permissions** → Add a permission → **My APIs** → Spst-Kniznica
2. Delegated → `access_as_user` → Add
3. **Grant admin consent** (ak máš práva)

### 3. App roles (pre Admin panel)

1. **App roles** → Create
   - Display name: `Admin`, Value: `Admin`, Allowed member types: Users/Groups
   - Display name: `Librarian`, Value: `Librarian`, Allowed member types: Users/Groups
2. **Enterprise applications** → Spst-Kniznica → Users and groups → priraď sebe rolu `Admin`

Bez role `Admin` sa prihlásenie podarí, ale `/admin` ostane bez admin práv.

### 4. Token configuration (odporúčané)

**Token configuration** → Add optional claim → Access → `email`, `preferred_username` (ak chýbajú).

## Overenie

```bash
./start.sh
curl -s http://127.0.0.1:5200/api/auth/config | jq .
```

`enabled` musí byť `true`. Potom otvor `http://localhost:3000/login` → **Prihlásiť cez Entra**.

## Vypnutie Entra (dev auth)

V `appsettings.Development.json` nastav `"Enabled": false` a reštartuj Auth/Admin. Frontend vtedy používa Development principal s rolou Admin.

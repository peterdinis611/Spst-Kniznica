namespace SpstKniznica.Common.Auth;

public static class AppRoles
{
    public const string Reader = "Reader";
    public const string Librarian = "Librarian";
    public const string Admin = "Admin";

    public const string Staff = $"{Librarian},{Admin}";
}

public static class AuthPolicies
{
    public const string Authenticated = "Authenticated";
    public const string Staff = "Staff";
    public const string AdminOnly = "AdminOnly";
}

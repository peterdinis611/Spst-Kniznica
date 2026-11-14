using System.Security.Claims;

namespace SpstKniznica.Common.Auth;

public static class ClaimsPrincipalExtensions
{
    public static string? GetObjectId(this ClaimsPrincipal user)
        => user.FindFirstValue("oid")
           ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

    public static string? GetDisplayName(this ClaimsPrincipal user)
    {
        var name = user.FindFirstValue("name")
                   ?? user.FindFirstValue(ClaimTypes.Name);

        var given = user.FindFirstValue("given_name");
        var family = user.FindFirstValue("family_name");
        var combined = string.Join(
            " ",
            new[] { given, family }.Where(static s => !string.IsNullOrWhiteSpace(s)));

        if (!string.IsNullOrWhiteSpace(name))
        {
            name = name.Trim();
            if (!string.IsNullOrWhiteSpace(family)
                && !name.Contains(' ', StringComparison.Ordinal)
                && (string.IsNullOrWhiteSpace(given)
                    || name.Equals(given.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                return $"{name} {family.Trim()}".Trim();
            }

            return name;
        }

        if (!string.IsNullOrWhiteSpace(combined))
            return combined.Trim();

        return user.GetEmail();
    }

    public static string? GetEmail(this ClaimsPrincipal user)
        => user.FindFirstValue(ClaimTypes.Email)
           ?? user.FindFirstValue("preferred_username")
           ?? user.FindFirstValue("upn")
           ?? user.FindFirstValue("emails");

    public static IReadOnlyList<string> GetRoles(this ClaimsPrincipal user)
    {
        var roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var claim in user.FindAll(ClaimTypes.Role)) roles.Add(claim.Value);
        foreach (var claim in user.FindAll("roles")) roles.Add(claim.Value);
        foreach (var claim in user.FindAll("role")) roles.Add(claim.Value);
        return roles.OrderBy(x => x, StringComparer.OrdinalIgnoreCase).ToArray();
    }

    public static bool IsStaff(this ClaimsPrincipal user)
        => user.IsInRole(AppRoles.Librarian)
           || user.IsInRole(AppRoles.Admin)
           || GetRoles(user).Any(role =>
               role.Equals(AppRoles.Librarian, StringComparison.OrdinalIgnoreCase)
               || role.Equals(AppRoles.Admin, StringComparison.OrdinalIgnoreCase));
}

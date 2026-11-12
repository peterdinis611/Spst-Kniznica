using System.Security.Claims;

namespace SpstKniznica.Common.Auth;

public static class ClaimsPrincipalExtensions
{
    public static string? GetObjectId(this ClaimsPrincipal user)
        => user.FindFirstValue("oid")
           ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

    public static string? GetDisplayName(this ClaimsPrincipal user)
        => user.FindFirstValue("name")
           ?? user.FindFirstValue(ClaimTypes.Name)
           ?? user.GetEmail();

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
}

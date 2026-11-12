using System.Security.Claims;
using FluentAssertions;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Tests.Auth;

public class ClaimsPrincipalExtensionsTests
{
    [Fact]
    public void Reads_identity_and_roles()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("oid", "abc"),
            new Claim("name", "Eva"),
            new Claim("preferred_username", "eva@spst.sk"),
            new Claim(ClaimTypes.Role, AppRoles.Admin),
            new Claim("roles", AppRoles.Librarian),
        ], "test"));

        user.GetObjectId().Should().Be("abc");
        user.GetDisplayName().Should().Be("Eva");
        user.GetEmail().Should().Be("eva@spst.sk");
        user.GetRoles().Should().BeEquivalentTo([AppRoles.Admin, AppRoles.Librarian]);
    }
}

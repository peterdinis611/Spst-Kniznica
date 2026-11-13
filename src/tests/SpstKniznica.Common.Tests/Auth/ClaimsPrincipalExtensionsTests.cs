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

    [Fact]
    public void Combines_given_and_family_when_name_is_only_first_name()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("name", "Peter"),
            new Claim("given_name", "Peter"),
            new Claim("family_name", "Dinis"),
        ], "test"));

        user.GetDisplayName().Should().Be("Peter Dinis");
    }

    [Fact]
    public void Uses_combined_given_family_when_name_claim_missing()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("given_name", "Eva"),
            new Claim("family_name", "Nováková"),
        ], "test"));

        user.GetDisplayName().Should().Be("Eva Nováková");
    }
}

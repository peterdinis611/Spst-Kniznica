using System.Security.Claims;
using AuthService.Controllers;
using AuthService.DTOs;
using AuthService.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using SpstKniznica.Common.Auth;

namespace AuthService.Tests.Controllers;

public class AuthControllerTests
{
    private readonly IAuthSettingsProvider _settings = Substitute.For<IAuthSettingsProvider>();
    private readonly IAuditLogger _audit = Substitute.For<IAuditLogger>();

    private AuthController CreateSut(ClaimsPrincipal? user = null)
    {
        var sut = new AuthController(_settings, _audit)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = user ?? new ClaimsPrincipal(new ClaimsIdentity()),
                },
            },
        };
        return sut;
    }

    [Fact]
    public async Task Config_returns_public_dto()
    {
        _settings.GetPublicConfigAsync(Arg.Any<CancellationToken>())
            .Returns(new AuthConfigDto
            {
                Enabled = true,
                ClientId = "client",
                HasLoginNotice = true,
                LoginNotice = "Hello",
                KnownRoles = [AppRoles.Reader, AppRoles.Librarian, AppRoles.Admin],
            });

        var result = await CreateSut().Config(CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<AuthConfigDto>().Subject;
        dto.Enabled.Should().BeTrue();
        dto.HasLoginNotice.Should().BeTrue();
        dto.KnownRoles.Should().Contain(AppRoles.Admin);
    }

    [Fact]
    public void Roles_returns_known_app_roles()
    {
        var result = CreateSut().Roles();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var roles = ok.Value.Should().BeAssignableTo<IReadOnlyList<string>>().Subject;
        roles.Should().BeEquivalentTo([AppRoles.Reader, AppRoles.Librarian, AppRoles.Admin]);
    }

    [Fact]
    public void Me_maps_staff_flags_from_roles()
    {
        var identity = new ClaimsIdentity(
            [
                new Claim("oid", "user-1"),
                new Claim("name", "Anna Admin"),
                new Claim("preferred_username", "anna@spst.sk"),
                new Claim(ClaimTypes.Role, AppRoles.Admin),
            ],
            authenticationType: "test");
        var sut = CreateSut(new ClaimsPrincipal(identity));

        var result = sut.Me();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<AuthUserDto>().Subject;
        dto.Id.Should().Be("user-1");
        dto.IsAdmin.Should().BeTrue();
        dto.IsStaff.Should().BeTrue();
        dto.IsAuthenticated.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateSettings_returns_bad_request_on_validation_error()
    {
        _settings.SaveOverridesAsync(Arg.Any<UpdateAuthSettingsRequest>(), Arg.Any<CancellationToken>())
            .Returns<Task<AuthSettingsDto>>(_ => throw new ArgumentException("RedirectUriHint is required."));

        var result = await CreateSut().UpdateSettings(
            new UpdateAuthSettingsRequest { RedirectUriHint = " " },
            CancellationToken.None);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
        _audit.DidNotReceiveWithAnyArgs().StaffAction(default!, default!, default!, default!, default);
    }
}

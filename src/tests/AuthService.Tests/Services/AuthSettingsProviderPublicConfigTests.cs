using AuthService.Data;
using AuthService.Options;
using AuthService.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Auth;
using MsOptions = Microsoft.Extensions.Options.Options;

namespace AuthService.Tests.Services;

public class AuthSettingsProviderPublicConfigTests : IAsyncLifetime
{
    private AuthDbContext _db = null!;
    private AuthSettingsProvider _sut = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<AuthDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _db = new AuthDbContext(options);
        await _db.Database.OpenConnectionAsync();
        await _db.Database.EnsureCreatedAsync();

        _sut = new AuthSettingsProvider(
            _db,
            MsOptions.Create(new EntraOptions
            {
                Enabled = true,
                TenantId = "tenant-secret",
                ClientId = "client-id",
                Audience = "api://client-id",
                ApiScope = "api://client-id/access_as_user",
                Instance = "https://login.microsoftonline.com/",
            }),
            MsOptions.Create(new AuthPresentationOptions
            {
                RedirectUriHint = "http://localhost:3000/login",
                LoginNotice = "Vitaj",
            }));
    }

    public async Task DisposeAsync() => await _db.DisposeAsync();

    [Fact]
    public async Task GetPublicConfig_omits_tenant_and_audience()
    {
        var dto = await _sut.GetPublicConfigAsync();

        dto.Enabled.Should().BeTrue();
        dto.ClientId.Should().Be("client-id");
        dto.Authority.Should().Contain("tenant-secret");
        dto.TenantId.Should().BeEmpty();
        dto.Audience.Should().BeEmpty();
        dto.ApiScope.Should().Be("api://client-id/access_as_user");
        dto.HasLoginNotice.Should().BeTrue();
        dto.KnownRoles.Should().Contain(AppRoles.Admin);
    }

    [Fact]
    public async Task GetPublicConfig_when_entra_disabled_hides_client_ids()
    {
        var sut = new AuthSettingsProvider(
            _db,
            MsOptions.Create(new EntraOptions { Enabled = false, ClientId = "client-id", TenantId = "t" }),
            MsOptions.Create(new AuthPresentationOptions()));

        var dto = await sut.GetPublicConfigAsync();

        dto.Enabled.Should().BeFalse();
        dto.ClientId.Should().BeEmpty();
        dto.Authority.Should().BeEmpty();
        dto.ApiScope.Should().BeEmpty();
    }
}

using AuthService.Data;
using AuthService.DTOs;
using AuthService.Models;
using AuthService.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Text;

namespace AuthService.Services;

public interface IAuthSettingsProvider
{
    Task<AuthConfigDto> GetPublicConfigAsync(CancellationToken cancellationToken = default);
    Task<AuthSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);
    Task<AuthSettingsDto> SaveOverridesAsync(
        UpdateAuthSettingsRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class AuthSettingsProvider(
    AuthDbContext db,
    IOptions<EntraOptions> entraOptions,
    IOptions<AuthPresentationOptions> presentationOptions) : IAuthSettingsProvider
{
    private AuthPresentationSnapshot? _cached;

    public async Task<AuthConfigDto> GetPublicConfigAsync(CancellationToken cancellationToken = default)
    {
        var snap = await GetSnapshotAsync(cancellationToken);
        var entra = entraOptions.Value;
        // Public surface: ClientId + Authority/ApiScope for MSAL.
        // TenantId/Audience stay off the anonymous payload (Authority already embeds tenant).
        return new AuthConfigDto
        {
            Enabled = entra.Enabled,
            TenantId = string.Empty,
            ClientId = entra.Enabled ? (entra.ClientId ?? string.Empty) : string.Empty,
            Audience = string.Empty,
            ApiScope = entra.Enabled
                ? (string.IsNullOrWhiteSpace(entra.ApiScope) && !string.IsNullOrWhiteSpace(entra.ClientId)
                    ? $"api://{entra.ClientId}/access_as_user"
                    : entra.ApiScope ?? string.Empty)
                : string.Empty,
            Authority = entra.Enabled ? entra.Authority : string.Empty,
            RedirectUriHint = snap.RedirectUriHint,
            LoginNotice = snap.LoginNotice,
            HasLoginNotice = !string.IsNullOrWhiteSpace(snap.LoginNotice),
            PresentationUpdatedAt = snap.UpdatedAt,
            KnownRoles = [AppRoles.Reader, AppRoles.Librarian, AppRoles.Admin],
        };
    }

    public async Task<AuthSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var snap = await GetSnapshotAsync(cancellationToken);
        var entra = entraOptions.Value;
        return new AuthSettingsDto
        {
            Enabled = entra.Enabled,
            TenantId = entra.TenantId ?? string.Empty,
            ClientId = entra.ClientId ?? string.Empty,
            Audience = string.IsNullOrWhiteSpace(entra.Audience)
                ? (string.IsNullOrWhiteSpace(entra.ClientId) ? string.Empty : $"api://{entra.ClientId}")
                : entra.Audience,
            ApiScope = string.IsNullOrWhiteSpace(entra.ApiScope) && !string.IsNullOrWhiteSpace(entra.ClientId)
                ? $"api://{entra.ClientId}/access_as_user"
                : entra.ApiScope ?? string.Empty,
            Authority = entra.Enabled ? entra.Authority : string.Empty,
            GrantStaffInDevelopment = entra.GrantStaffInDevelopment,
            RedirectUriHint = snap.RedirectUriHint,
            LoginNotice = snap.LoginNotice,
            UpdatedAt = snap.UpdatedAt,
            HasOverrides = snap.HasOverrides,
        };
    }

    public async Task<AuthSettingsDto> SaveOverridesAsync(
        UpdateAuthSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        var hint = StringNormalize.Required(request.RedirectUriHint);
        if (!Uri.TryCreate(hint, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("RedirectUriHint must be an absolute http(s) URL.");
        }

        var notice = StringNormalize.Optional(request.LoginNotice);

        var row = await db.AuthSettingsStore
            .FirstOrDefaultAsync(s => s.Id == AuthSettingsStore.SingletonId, cancellationToken);

        if (row is null)
        {
            row = new AuthSettingsStore { Id = AuthSettingsStore.SingletonId };
            db.AuthSettingsStore.Add(row);
        }

        row.RedirectUriHint = hint;
        row.LoginNotice = notice;
        row.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        _cached = null;

        return await GetSettingsAsync(cancellationToken);
    }

    private async Task<AuthPresentationSnapshot> GetSnapshotAsync(CancellationToken cancellationToken)
    {
        if (_cached is not null) return _cached;

        var baseline = presentationOptions.Value;
        var row = await db.AuthSettingsStore.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == AuthSettingsStore.SingletonId, cancellationToken);

        _cached = row is null
            ? new AuthPresentationSnapshot(
                string.IsNullOrWhiteSpace(baseline.RedirectUriHint)
                    ? "http://localhost:3000/login"
                    : baseline.RedirectUriHint.Trim(),
                StringNormalize.Optional(baseline.LoginNotice),
                UpdatedAt: null,
                HasOverrides: false)
            : new AuthPresentationSnapshot(
                row.RedirectUriHint,
                row.LoginNotice,
                row.UpdatedAt,
                HasOverrides: true);

        return _cached;
    }

    private sealed record AuthPresentationSnapshot(
        string RedirectUriHint,
        string? LoginNotice,
        DateTimeOffset? UpdatedAt,
        bool HasOverrides);
}

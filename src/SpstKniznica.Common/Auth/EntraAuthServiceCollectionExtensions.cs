using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace SpstKniznica.Common.Auth;

public static class EntraAuthServiceCollectionExtensions
{
    public static IServiceCollection AddSpstEntraAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment,
        bool requireAuthenticatedByDefault = false)
    {
        services.Configure<EntraOptions>(configuration.GetSection(EntraOptions.SectionName));
        var entra = configuration.GetSection(EntraOptions.SectionName).Get<EntraOptions>()
            ?? new EntraOptions();

        if (entra.Enabled)
        {
            if (string.IsNullOrWhiteSpace(entra.TenantId) ||
                string.IsNullOrWhiteSpace(entra.ClientId) ||
                string.IsNullOrWhiteSpace(entra.Audience))
            {
                throw new InvalidOperationException(
                    "Entra is enabled but TenantId/ClientId/Audience are missing.");
            }

            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.Authority = entra.Authority;
                    options.Audience = entra.Audience;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuers =
                        [
                            $"https://login.microsoftonline.com/{entra.TenantId}/v2.0",
                            $"https://sts.windows.net/{entra.TenantId}/",
                        ],
                        ValidateAudience = true,
                        ValidAudiences =
                        [
                            entra.Audience,
                            entra.ClientId,
                            $"api://{entra.ClientId}",
                        ],
                        NameClaimType = "name",
                        RoleClaimType = ClaimTypes.Role,
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = context =>
                        {
                            MapRoles(context.Principal);
                            return Task.CompletedTask;
                        },
                    };
                });
        }
        else
        {
            if (!environment.IsDevelopment())
            {
                throw new InvalidOperationException(
                    "Entra authentication is disabled. DevelopmentAuthHandler is only allowed " +
                    "when ASPNETCORE_ENVIRONMENT=Development. Enable Entra:Enabled for other environments.");
            }

            services
                .AddAuthentication(DevelopmentAuthHandler.SchemeName)
                .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, DevelopmentAuthHandler>(
                    DevelopmentAuthHandler.SchemeName,
                    _ => { });
        }

        services.Configure<InternalApiOptions>(configuration.GetSection(InternalApiOptions.SectionName));
        services.AddHttpContextAccessor();
        services.AddSingleton<IAuthorizationHandler, InternalApiKeyAuthorizationHandler>();

        services.AddAuthorization(options =>
        {
            options.AddPolicy(
                AuthPolicies.Authenticated,
                policy => policy.RequireAuthenticatedUser());

            options.AddPolicy(
                AuthPolicies.Staff,
                policy => policy.RequireRole(AppRoles.Librarian, AppRoles.Admin));

            options.AddPolicy(
                AuthPolicies.AdminOnly,
                policy => policy.RequireRole(AppRoles.Admin));

            options.AddPolicy(
                AuthPolicies.InternalService,
                policy => policy.AddRequirements(new InternalApiKeyRequirement()));

            options.FallbackPolicy = requireAuthenticatedByDefault
                ? new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build()
                : null;
        });

        return services;
    }

    public static IApplicationBuilder UseSpstAuthentication(this IApplicationBuilder app)
        => app.UseAuthentication();

    private static void MapRoles(ClaimsPrincipal? principal)
    {
        if (principal?.Identity is not ClaimsIdentity identity)
        {
            return;
        }

        var roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var claim in identity.FindAll("roles"))
        {
            roles.Add(claim.Value);
        }

        foreach (var claim in identity.FindAll("role"))
        {
            roles.Add(claim.Value);
        }

        foreach (var claim in identity.FindAll(ClaimTypes.Role))
        {
            roles.Add(claim.Value);
        }

        foreach (var role in roles)
        {
            if (!identity.HasClaim(ClaimTypes.Role, role))
            {
                identity.AddClaim(new Claim(ClaimTypes.Role, role));
            }
        }
    }
}

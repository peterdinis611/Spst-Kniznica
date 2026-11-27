using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SpstKniznica.Common.Hosting;

/// <summary>
/// Baseline security headers for API / gateway responses.
/// Browser-facing CSP stays on Next.js; here we harden API surfaces.
/// </summary>
public static class SecurityHeadersExtensions
{
    public static IApplicationBuilder UseSpstSecurityHeaders(this IApplicationBuilder app)
    {
        var environment = app.ApplicationServices.GetService<IHostEnvironment>();

        return app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                var headers = context.Response.Headers;

                SetIfAbsent(headers, "X-Content-Type-Options", "nosniff");
                SetIfAbsent(headers, "X-Frame-Options", "DENY");
                SetIfAbsent(headers, "Referrer-Policy", "no-referrer");
                SetIfAbsent(headers, "X-Permitted-Cross-Domain-Policies", "none");
                SetIfAbsent(
                    headers,
                    "Permissions-Policy",
                    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()");
                // API documents must not host scripts or be framed.
                SetIfAbsent(
                    headers,
                    "Content-Security-Policy",
                    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
                // Allow CORS fetches from the Next app (possibly another subdomain).
                SetIfAbsent(headers, "Cross-Origin-Resource-Policy", "cross-origin");
                SetIfAbsent(headers, "Cross-Origin-Opener-Policy", "same-origin");

                if (environment is not null && !environment.IsDevelopment())
                {
                    SetIfAbsent(
                        headers,
                        "Strict-Transport-Security",
                        "max-age=63072000; includeSubDomains; preload");
                }

                headers.Remove("Server");
                headers.Remove("X-Powered-By");
                return Task.CompletedTask;
            });

            await next();
        });
    }

    private static void SetIfAbsent(IHeaderDictionary headers, string name, string value)
    {
        if (!headers.ContainsKey(name))
        {
            headers[name] = value;
        }
    }
}

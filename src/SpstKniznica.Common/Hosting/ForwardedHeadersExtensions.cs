using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SpstKniznica.Common.Hosting;

public sealed class SpstForwardedHeadersOptions
{
    public const string SectionName = "ForwardedHeaders";

    /// <summary>When true, process X-Forwarded-For / X-Forwarded-Proto from known proxies.</summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// Known proxy IPs. Empty = clear KnownNetworks/Proxies and accept any
    /// (only safe on private networks behind a single edge proxy).
    /// </summary>
    public string[] KnownProxies { get; set; } = [];
}

public static class ForwardedHeadersExtensions
{
    public static IServiceCollection AddSpstForwardedHeaders(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<SpstForwardedHeadersOptions>(
            configuration.GetSection(SpstForwardedHeadersOptions.SectionName));
        return services;
    }

    public static IApplicationBuilder UseSpstForwardedHeaders(this IApplicationBuilder app)
    {
        var config = app.ApplicationServices.GetService<IConfiguration>();
        var options = config?.GetSection(SpstForwardedHeadersOptions.SectionName)
            .Get<SpstForwardedHeadersOptions>() ?? new SpstForwardedHeadersOptions();

        if (!options.Enabled)
        {
            return app;
        }

        var forwarded = new Microsoft.AspNetCore.Builder.ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
        };

        forwarded.KnownIPNetworks.Clear();
        forwarded.KnownProxies.Clear();

        foreach (var entry in options.KnownProxies)
        {
            if (System.Net.IPAddress.TryParse(entry.Trim(), out var ip))
            {
                forwarded.KnownProxies.Add(ip);
            }
        }

        return app.UseForwardedHeaders(forwarded);
    }

    public static IApplicationBuilder UseSpstHstsWhenPublic(
        this IApplicationBuilder app,
        IHostEnvironment environment)
    {
        if (!environment.IsDevelopment())
        {
            app.UseHsts();
        }

        return app;
    }
}

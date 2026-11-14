using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace SpstKniznica.Common.Hosting;

public sealed class NetworkOptions
{
    public const string SectionName = "Network";

    /// <summary>
    /// When true (and ASPNETCORE_URLS is unset), bind only to loopback so the
    /// service is reachable from the same host / private network, not the public internet.
    /// </summary>
    public bool BindLoopbackOnly { get; set; }

    /// <summary>e.g. http://127.0.0.1:5203</summary>
    public string? ListenUrl { get; set; }
}

public static class NetworkIsolationExtensions
{
    public static WebApplicationBuilder UseSpstNetworkIsolation(this WebApplicationBuilder builder)
    {
        var network = builder.Configuration.GetSection(NetworkOptions.SectionName).Get<NetworkOptions>()
            ?? new NetworkOptions();

        if (!network.BindLoopbackOnly)
        {
            return builder;
        }

        if (!string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
        {
            return builder;
        }

        if (string.IsNullOrWhiteSpace(network.ListenUrl))
        {
            return builder;
        }

        builder.WebHost.UseUrls(network.ListenUrl.Trim());
        return builder;
    }
}

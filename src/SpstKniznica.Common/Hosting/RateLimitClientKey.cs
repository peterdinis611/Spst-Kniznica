using System.Net;
using Microsoft.AspNetCore.Http;

namespace SpstKniznica.Common.Hosting;

public static class RateLimitClientKey
{
    public static string Resolve(
        HttpContext httpContext,
        bool trustForwardedFor,
        IReadOnlySet<IPAddress> knownProxies)
    {
        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            return "u:" + (
                httpContext.User.FindFirst("oid")?.Value
                ?? httpContext.User.Identity.Name
                ?? "auth");
        }

        var remote = httpContext.Connection.RemoteIpAddress;
        if (trustForwardedFor
            && remote is not null
            && knownProxies.Contains(Normalize(remote))
            && TryLastForwardedHop(httpContext, out var client))
        {
            return "ip:" + client;
        }

        return "ip:" + (remote?.ToString() ?? "unknown");
    }

    public static HashSet<IPAddress> ParseProxies(IEnumerable<string>? values)
    {
        var set = new HashSet<IPAddress>();
        if (values is null)
        {
            return set;
        }

        foreach (var value in values)
        {
            if (IPAddress.TryParse(value?.Trim(), out var ip))
            {
                set.Add(Normalize(ip));
            }
        }

        return set;
    }

    public static IPAddress Normalize(IPAddress ip) =>
        ip.IsIPv4MappedToIPv6 ? ip.MapToIPv4() : ip;

    private static bool TryLastForwardedHop(HttpContext httpContext, out string client)
    {
        client = "";
        var forwarded = httpContext.Request.Headers["X-Forwarded-For"].ToString();
        if (string.IsNullOrWhiteSpace(forwarded))
        {
            return false;
        }

        var hops = forwarded.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (hops.Length == 0 || !IPAddress.TryParse(hops[^1], out _))
        {
            return false;
        }

        client = hops[^1];
        return true;
    }
}

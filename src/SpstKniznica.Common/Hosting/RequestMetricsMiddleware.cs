using System.Diagnostics;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Hosting;

public sealed class RequestMetricsMiddleware(RequestDelegate next, RequestMetrics metrics)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "/";
        if (path.StartsWith("/metrics", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/health", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var sw = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            sw.Stop();
            metrics.Record(path, context.Response.StatusCode, sw.ElapsedMilliseconds);
        }
    }
}

public static class RequestMetricsExtensions
{
    public const string MetricsKeyHeader = "X-Metrics-Key";

    public static IServiceCollection AddSpstRequestMetrics(this IServiceCollection services)
    {
        services.Configure<MetricsOptions>(_ => { });
        services.AddSingleton<RequestMetrics>();
        return services;
    }

    public static IServiceCollection AddSpstRequestMetrics(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<MetricsOptions>(configuration.GetSection(MetricsOptions.SectionName));
        services.AddSingleton<RequestMetrics>();
        return services;
    }

    public static IApplicationBuilder UseSpstRequestMetrics(this IApplicationBuilder app)
        => app.UseMiddleware<RequestMetricsMiddleware>();

    public static IEndpointRouteBuilder MapSpstMetrics(this IEndpointRouteBuilder endpoints, string serviceName)
    {
        endpoints.MapGet("/metrics", (
                HttpRequest request,
                RequestMetrics metrics,
                IOptions<MetricsOptions> metricsOptions,
                IOptions<InternalApiOptions> internalApi) =>
            {
                if (!IsMetricsAuthorized(request, metricsOptions.Value, internalApi.Value))
                {
                    return Results.Unauthorized();
                }

                var accept = request.Headers.Accept.ToString();
                var wantProm = request.Query.ContainsKey("format")
                        && string.Equals(request.Query["format"], "prom", StringComparison.OrdinalIgnoreCase)
                    || accept.Contains("text/plain", StringComparison.OrdinalIgnoreCase)
                    || accept.Contains("openmetrics", StringComparison.OrdinalIgnoreCase);

                if (wantProm)
                {
                    return Results.Text(metrics.ToPrometheus(serviceName), "text/plain; version=0.0.4; charset=utf-8");
                }

                return Results.Json(metrics.Snapshot(serviceName));
            })
            .AllowAnonymous()
            .WithTags("Observability");
        return endpoints;
    }

    private static bool IsMetricsAuthorized(
        HttpRequest request,
        MetricsOptions metricsOptions,
        InternalApiOptions internalApi)
    {
        if (!metricsOptions.RequireKey)
        {
            return true;
        }

        var expected = metricsOptions.ApiKey?.Trim();
        if (string.IsNullOrEmpty(expected))
        {
            expected = internalApi.SharedKey?.Trim();
        }

        if (string.IsNullOrEmpty(expected))
        {
            return false;
        }

        if (request.Headers.TryGetValue(MetricsKeyHeader, out var metricsKey)
            && string.Equals(metricsKey.ToString(), expected, StringComparison.Ordinal))
        {
            return true;
        }

        if (request.Headers.TryGetValue(InternalApiOptions.HeaderName, out var internalKey)
            && string.Equals(internalKey.ToString(), expected, StringComparison.Ordinal))
        {
            return true;
        }

        return false;
    }
}

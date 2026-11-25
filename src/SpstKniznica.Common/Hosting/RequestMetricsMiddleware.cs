using System.Diagnostics;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

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
    public static IServiceCollection AddSpstRequestMetrics(this IServiceCollection services)
    {
        services.AddSingleton<RequestMetrics>();
        return services;
    }

    public static IApplicationBuilder UseSpstRequestMetrics(this IApplicationBuilder app)
        => app.UseMiddleware<RequestMetricsMiddleware>();

    public static IEndpointRouteBuilder MapSpstMetrics(this IEndpointRouteBuilder endpoints, string serviceName)
    {
        endpoints.MapGet("/metrics", (HttpRequest request, RequestMetrics metrics) =>
            {
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
}

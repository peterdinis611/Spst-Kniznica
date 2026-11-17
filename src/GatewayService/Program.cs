using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;
using GatewayService.Health;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Configuration.AddJsonFile("reverse-proxy.json", optional: false, reloadOnChange: true);
    builder.UseSpstSerilog("GatewayService");
    // Gateway stays publicly reachable; downstream services use Network:BindLoopbackOnly.
    builder.UseSpstNetworkIsolation();

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "GatewayService API",
            Version = "v1",
            Description = "SPST knižnica – API Gateway (YARP) pre Book, Category, Author, Booking, Workers, Messaging, Cache, Auth a Admin."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);
    builder.Services.AddSpstEntraAuthentication(builder.Configuration, builder.Environment);
    builder.Services.AddSpstApiRateLimiting(builder.Configuration);

    builder.Services
        .AddReverseProxy()
        .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

    builder.Services.AddHttpClient("gateway-ready", client =>
    {
        client.Timeout = TimeSpan.FromSeconds(2);
    });

    var bookBase = builder.Configuration["Services:BookService"]?.TrimEnd('/')
        ?? "http://localhost:5203";
    var bookingBase = builder.Configuration["Services:BookingService"]?.TrimEnd('/')
        ?? "http://localhost:5208";
    var authorBase = builder.Configuration["Services:AuthorService"]?.TrimEnd('/')
        ?? "http://localhost:5207";
    var categoryBase = builder.Configuration["Services:CategoryService"]?.TrimEnd('/')
        ?? "http://localhost:5204";

    builder.Services.AddHealthChecks()
        .AddCheck("self", () => HealthCheckResult.Healthy("GatewayService"), tags: ["live"])
        .Add(new HealthCheckRegistration(
            "book",
            sp => new DownstreamReadyCheck(
                "BookService",
                $"{bookBase}/health",
                sp.GetRequiredService<IHttpClientFactory>()),
            failureStatus: HealthStatus.Unhealthy,
            tags: ["ready", "core"]))
        .Add(new HealthCheckRegistration(
            "booking",
            sp => new DownstreamReadyCheck(
                "BookingService",
                $"{bookingBase}/health",
                sp.GetRequiredService<IHttpClientFactory>()),
            failureStatus: HealthStatus.Unhealthy,
            tags: ["ready", "core"]))
        .Add(new HealthCheckRegistration(
            "author",
            sp => new DownstreamReadyCheck(
                "AuthorService",
                $"{authorBase}/health",
                sp.GetRequiredService<IHttpClientFactory>()),
            failureStatus: HealthStatus.Degraded,
            tags: ["ready", "catalog"]))
        .Add(new HealthCheckRegistration(
            "category",
            sp => new DownstreamReadyCheck(
                "CategoryService",
                $"{categoryBase}/health",
                sp.GetRequiredService<IHttpClientFactory>()),
            failureStatus: HealthStatus.Degraded,
            tags: ["ready", "catalog"]));

    var app = builder.Build();

    Log.Information("Starting GatewayService in {Environment}", app.Environment.EnvironmentName);

    app.UseSpstRequestLogging();
    app.UseSpstCors();

    if (app.Environment.ShouldExposeSwagger())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "GatewayService v1");
            options.SwaggerEndpoint("/books/swagger/v1/swagger.json", "BookService");
            options.SwaggerEndpoint("/categories/swagger/v1/swagger.json", "CategoryService");
            options.SwaggerEndpoint("/authors/swagger/v1/swagger.json", "AuthorService");
            options.SwaggerEndpoint("/bookings/swagger/v1/swagger.json", "BookingService");
            options.SwaggerEndpoint("/workers/swagger/v1/swagger.json", "WorkersService");
            options.SwaggerEndpoint("/messaging/swagger/v1/swagger.json", "MessagingService");
            options.SwaggerEndpoint("/cache/swagger/v1/swagger.json", "CacheService");
            options.SwaggerEndpoint("/auth/swagger/v1/swagger.json", "AuthService");
            options.SwaggerEndpoint("/admin/swagger/v1/swagger.json", "AdminService");
            options.SwaggerEndpoint("/email/swagger/v1/swagger.json", "EmailService");
            options.RoutePrefix = "swagger";
        });
    }

    app.UseSpstRateLimiting();
    app.UseSpstAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    // Liveness: process is up (does not require Book/Booking).
    app.MapHealthChecks("/health", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("live"),
    }).AllowAnonymous();

    // Readiness: core deps must be up; author/category may degrade the status.
    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready"),
        ResponseWriter = WriteReadyResponseAsync,
    }).AllowAnonymous();

    if (app.Environment.ShouldExposeSwagger())
    {
        app.MapGet("/", () => Results.Redirect("/swagger")).AllowAnonymous();
    }
    else
    {
        app.MapGet("/", () => Results.Ok(new
        {
            service = "GatewayService",
            health = "/health",
            ready = "/health/ready",
        })).AllowAnonymous();
    }

    app.MapReverseProxy();

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}

static async Task WriteReadyResponseAsync(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";

    var status = report.Status switch
    {
        HealthStatus.Healthy => "Healthy",
        HealthStatus.Degraded => "Degraded",
        _ => "Unhealthy",
    };

    context.Response.StatusCode = report.Status switch
    {
        HealthStatus.Healthy => StatusCodes.Status200OK,
        HealthStatus.Degraded => StatusCodes.Status200OK,
        _ => StatusCodes.Status503ServiceUnavailable,
    };

    var payload = new
    {
        status,
        totalDurationMs = report.TotalDuration.TotalMilliseconds,
        entries = report.Entries.ToDictionary(
            e => e.Key,
            e => new
            {
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                durationMs = e.Value.Duration.TotalMilliseconds,
            }),
    };

    await context.Response.WriteAsJsonAsync(payload);
}

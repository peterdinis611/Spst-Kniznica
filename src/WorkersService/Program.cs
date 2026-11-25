using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;
using WorkersService.Jobs;
using WorkersService.Queue;
using LoanLifecycleOptions = WorkersService.Jobs.LoanLifecycleOptions;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("WorkersService");
    builder.UseSpstNetworkIsolation();

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "WorkersService API",
            Version = "v1",
            Description = "SPST knižnica – .NET worker pre async order joby (persistent queue + BackgroundService)."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);
    builder.Services.AddSpstEntraAuthentication(
        builder.Configuration,
        builder.Environment,
        requireAuthenticatedByDefault: true);
    builder.Services.AddSpstApiRateLimiting(builder.Configuration);
    builder.Services.AddSpstAuditLoggingToAdmin(builder.Configuration, sourceService: "WorkersService");

    builder.Services.Configure<LoanLifecycleOptions>(
        builder.Configuration.GetSection(LoanLifecycleOptions.SectionName));
    builder.Services.AddHttpClient("loan-lifecycle")
        .AddSpstResilienceExternal();
    builder.Services.AddSingleton<IOrderJobQueue, FileBackedOrderJobQueue>();
    builder.Services.AddHostedService<OrderProcessingHostedService>();
    builder.Services.AddHostedService<LoanLifecycleHostedService>();
    builder.Services.AddSpstRequestMetrics();
    builder.Services.AddHealthChecks()
        .AddCheck<OrderQueueHealthCheck>("order-queue");

    var app = builder.Build();

    Log.Information("Starting WorkersService in {Environment} environment", app.Environment.EnvironmentName);

    app.UseSpstRequestLogging();
    app.UseSpstRequestMetrics();
    app.UseSpstCors();
    if (app.Environment.ShouldExposeSwagger())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "WorkersService v1");
            options.RoutePrefix = "swagger";
        });
    }
    app.UseHttpsRedirection();
    app.UseSpstRateLimiting();
    app.UseSpstAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapSpstMetrics("WorkersService");
    app.MapHealthChecks("/health").AllowAnonymous();

    Log.Information("WorkersService is ready. Health: /health, Enqueue: POST /api/orders/enqueue");
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

file sealed class OrderQueueHealthCheck(IOrderJobQueue queue) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var pending = queue.PendingCount;
        var data = new Dictionary<string, object> { ["pending"] = pending };
        return Task.FromResult(
            HealthCheckResult.Healthy($"order queue pending={pending}", data));
    }
}

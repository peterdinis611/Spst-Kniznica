using Serilog;
using SpstKniznica.Caching;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("CacheService");
    builder.UseSpstNetworkIsolation();

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "CacheService API",
            Version = "v1",
            Description = "SPST knižnica – Redis cache admin (zdieľaná knižnica SpstKniznica.Caching)."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);
    builder.Services.AddSpstEntraAuthentication(builder.Configuration, builder.Environment);
    builder.Services.AddSpstApiRateLimiting(builder.Configuration);
    builder.Services.AddSpstCaching(builder.Configuration, instanceName: "spst:");

    var cacheEnabled = builder.Configuration.GetValue("Cache:Enabled", true);
    var redisConnection = builder.Configuration["Cache:ConnectionString"] ?? "localhost:6379";
    var healthChecks = builder.Services.AddHealthChecks();
    if (cacheEnabled)
    {
        healthChecks.AddRedis(redisConnection, name: "redis");
    }

    var app = builder.Build();

    Log.Information(
        "Starting CacheService. Enabled={Enabled}, Redis={Redis}",
        cacheEnabled,
        redisConnection);

    app.UseSpstRequestLogging();
    app.UseSpstCors();
    if (app.Environment.ShouldExposeSwagger())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "CacheService v1");
            options.RoutePrefix = "swagger";
        });
    }

    app.UseHttpsRedirection();
    app.UseSpstRateLimiting();
    app.UseSpstAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health").AllowAnonymous();

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

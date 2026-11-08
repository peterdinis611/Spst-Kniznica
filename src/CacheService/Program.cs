using Serilog;
using SpstKniznica.Caching;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "CacheService"));

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

    builder.Services.AddSpstCaching(builder.Configuration, instanceName: "spst:");

    var redisConnection = builder.Configuration["Cache:ConnectionString"] ?? "localhost:6379";
    builder.Services.AddHealthChecks()
        .AddRedis(redisConnection, name: "redis");

    var app = builder.Build();

    Log.Information(
        "Starting CacheService. Enabled={Enabled}, Redis={Redis}",
        builder.Configuration.GetValue("Cache:Enabled", true),
        redisConnection);

    app.UseSerilogRequestLogging();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "CacheService v1");
        options.RoutePrefix = "swagger";
    });

    app.UseHttpsRedirection();
    app.MapControllers();
    app.MapHealthChecks("/health");

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

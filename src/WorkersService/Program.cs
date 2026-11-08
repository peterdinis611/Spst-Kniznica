using Serilog;
using SpstKniznica.Common.Hosting;
using WorkersService.Jobs;
using WorkersService.Queue;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("WorkersService");

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "WorkersService API",
            Version = "v1",
            Description = "SPST knižnica – .NET worker pre async order joby (Channel queue + BackgroundService)."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration);

    builder.Services.AddSingleton<IOrderJobQueue, ChannelOrderJobQueue>();
    builder.Services.AddHostedService<OrderProcessingHostedService>();
    builder.Services.AddHealthChecks();

    var app = builder.Build();

    Log.Information("Starting WorkersService in {Environment} environment", app.Environment.EnvironmentName);

    app.UseSpstRequestLogging();
    app.UseSpstCors();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "WorkersService v1");
        options.RoutePrefix = "swagger";
    });

    app.UseHttpsRedirection();
    app.MapControllers();
    app.MapHealthChecks("/health");

    Log.Information("WorkersService is ready. Swagger: /swagger, Health: /health, Enqueue: POST /api/orders/enqueue");
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

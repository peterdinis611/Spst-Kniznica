using Serilog;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("AdminService");

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "AdminService API",
            Version = "v1",
            Description = "SPST knižnica – admin pult (Entra role Admin/Librarian)."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration);
    builder.Services.AddSpstEntraAuthentication(builder.Configuration);
    builder.Services.AddHttpClient();
    builder.Services.AddSingleton<AdminService.Services.AdminDashboardService>();
    builder.Services.AddHealthChecks();

    var app = builder.Build();

    Log.Information(
        "Starting AdminService in {Environment}; Entra enabled={Enabled}",
        app.Environment.EnvironmentName,
        app.Configuration.GetValue("Entra:Enabled", false));

    app.UseSpstRequestLogging();
    app.UseSpstCors();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "AdminService v1");
        options.RoutePrefix = "swagger";
    });

    app.UseSpstAuthentication();
    app.UseAuthorization();
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

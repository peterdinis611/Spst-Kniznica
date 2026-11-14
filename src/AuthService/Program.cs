using Serilog;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("AuthService");

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "AuthService API",
            Version = "v1",
            Description = "SPST knižnica – Entra ID profil, konfigurácia a session informácie."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);
    builder.Services.AddSpstEntraAuthentication(
        builder.Configuration,
        builder.Environment,
        requireAuthenticatedByDefault: true);
    builder.Services.AddHealthChecks();

    var app = builder.Build();

    Log.Information(
        "Starting AuthService in {Environment}; Entra enabled={Enabled}",
        app.Environment.EnvironmentName,
        app.Configuration.GetValue("Entra:Enabled", false));

    app.UseSpstRequestLogging();
    app.UseSpstCors();
    app.UseSpstSwagger("AuthService v1");
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

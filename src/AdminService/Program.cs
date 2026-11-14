using AdminService.Data;
using AdminService.Services;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
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
    builder.UseSpstNetworkIsolation();

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
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);
    builder.Services.AddSpstEntraAuthentication(
        builder.Configuration,
        builder.Environment,
        requireAuthenticatedByDefault: true);
    builder.Services.AddSpstApiRateLimiting(builder.Configuration);
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddHttpClient("admin-downstream", client =>
    {
        client.Timeout = TimeSpan.FromSeconds(3);
        client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
    });

    builder.Services.AddDbContext<AdminDbContext>(options =>
        options.UseSqlite(
            builder.Configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=admin.db"));

    builder.Services.AddScoped<AuditLogService>();
    builder.Services.AddScoped<IAuditSink>(sp => sp.GetRequiredService<AuditLogService>());
    builder.Services.AddSpstAuditLogging();

    builder.Services.AddSingleton<AdminService.Services.AdminDownstreamClient>();
    builder.Services.AddSingleton<AdminService.Services.AdminDashboardService>();
    builder.Services.AddSingleton<AdminService.Services.AdminOverviewService>();
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<AdminDbContext>("database");

    var app = builder.Build();

    Log.Information(
        "Starting AdminService in {Environment}; Entra enabled={Enabled}",
        app.Environment.EnvironmentName,
        app.Configuration.GetValue("Entra:Enabled", false));

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AdminDbContext>();
        await db.Database.EnsureCreatedAsync();
        Log.Information("Admin database ready (audit logs)");
    }

    app.UseSpstRequestLogging();
    app.UseSpstCors();
    if (app.Environment.ShouldExposeSwagger())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "AdminService v1");
            options.RoutePrefix = "swagger";
        });
    }
    app.UseSpstRateLimiting();
    app.UseSpstAuthentication();
    app.UseAuthorization();
    app.MapControllers().RequireRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy);
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

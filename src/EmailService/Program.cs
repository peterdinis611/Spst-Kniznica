using EmailService.Data;
using EmailService.Options;
using EmailService.Services;
using EmailService.Templating;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Data;
using SpstKniznica.Common.Hosting;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("EmailService");
    builder.UseSpstNetworkIsolation();

    builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection(SmtpOptions.SectionName));
    builder.Services.Configure<EmailDispatchOptions>(
        builder.Configuration.GetSection(EmailDispatchOptions.SectionName));

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "EmailService API",
            Version = "v1",
            Description = "SPST knižnica – odosielanie e-mailov (SMTP / log-only) a šablóny výpožičiek."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);
    builder.Services.AddSpstEntraAuthentication(
        builder.Configuration,
        builder.Environment,
        requireAuthenticatedByDefault: true);
    builder.Services.AddSpstApiRateLimiting(builder.Configuration);
    builder.Services.AddHttpContextAccessor();

    builder.Services.AddDbContext<EmailDbContext>(options =>
        options.UseSpstDatabase(builder.Configuration, "email.db")
            .ConfigureSpstMigrations());

    var smtpEnabled = builder.Configuration.GetValue("Smtp:Enabled", false);
    var dispatch = builder.Configuration.GetSection(EmailDispatchOptions.SectionName)
        .Get<EmailDispatchOptions>() ?? new EmailDispatchOptions();
    if (!builder.Environment.IsDevelopment())
    {
        if (dispatch.AllowedRecipientDomains is not { Length: > 0 })
        {
            throw new InvalidOperationException(
                "EmailDispatch:AllowedRecipientDomains must be non-empty outside Development.");
        }

        if (!dispatch.RequireTemplateKeyForRawSend)
        {
            throw new InvalidOperationException(
                "EmailDispatch:RequireTemplateKeyForRawSend must be true outside Development.");
        }
    }

    if (smtpEnabled)
    {
        builder.Services.AddSingleton<IEmailTransport, SmtpEmailTransport>();
    }
    else
    {
        builder.Services.AddSingleton<IEmailTransport, LoggingEmailTransport>();
    }

    builder.Services.AddSingleton<LoanEmailHtmlRenderer>();
    builder.Services.AddScoped<IEmailDispatchService, EmailDispatchService>();
    builder.Services.AddHostedService<EmailRetryHostedService>();
    builder.Services.AddSpstAuditLoggingToAdmin(builder.Configuration, sourceService: "EmailService");
    builder.Services.AddSpstRequestMetrics(builder.Configuration);

    builder.Services.AddHealthChecks()
        .AddDbContextCheck<EmailDbContext>("database");

    var app = builder.Build();

    Log.Information(
        "Starting EmailService in {Environment}; SMTP enabled={SmtpEnabled}",
        app.Environment.EnvironmentName,
        smtpEnabled);

    await app.Services.MigrateSpstDatabaseAsync<EmailDbContext>(
        "EmailService",
        async (db, ct) => await EmailSchema.EnsureAsync(db, ct));

    app.UseSpstRequestLogging();
    app.UseSpstRequestMetrics();
    app.UseSpstSecurityHeaders();
    app.UseSpstCors();
    if (app.Environment.ShouldExposeSwagger())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "EmailService v1");
            options.RoutePrefix = "swagger";
        });
    }

    app.UseSpstRateLimiting();
    app.UseSpstAuthentication();
    app.UseAuthorization();
    app.MapControllers().RequireRateLimiting(RateLimitingServiceCollectionExtensions.SensitiveWritePolicy);
    app.MapSpstMetrics("EmailService");
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

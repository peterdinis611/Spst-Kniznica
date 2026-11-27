using BookingService.Clients;
using BookingService.Data;
using BookingService.Interfaces;
using BookingService.Messaging;
using BookingService.Middleware;
using BookingService.Options;
using BookingService.Repositories;
using BookingService.Services;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SpstKniznica.Caching;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Data;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Integrations;
using SpstKniznica.Common.Messaging;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("BookingService");
    builder.UseSpstNetworkIsolation();

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "BookingService API",
            Version = "v1",
            Description = "SPST knižnica – správa rezervácií a výpožičiek."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);
    builder.Services.AddSpstEntraAuthentication(
        builder.Configuration,
        builder.Environment,
        requireAuthenticatedByDefault: true);
    builder.Services.AddSpstApiRateLimiting(builder.Configuration);
    builder.Services.AddSpstRequestMetrics(builder.Configuration);
    builder.Services.AddSpstAuditLoggingToAdmin(builder.Configuration, sourceService: "BookingService");
    builder.Services.AddSpstIntegrations(builder.Configuration);

    builder.Services.AddDbContext<BookingDbContext>(options =>
        options.UseSpstDatabase(builder.Configuration, "bookings.db")
            .ConfigureSpstMigrations());

    builder.Services.Configure<BookCatalogOptions>(
        builder.Configuration.GetSection(BookCatalogOptions.SectionName));
    builder.Services.Configure<EmailServiceOptions>(
        builder.Configuration.GetSection(EmailServiceOptions.SectionName));
    builder.Services.Configure<LoanPolicyOptions>(
        builder.Configuration.GetSection(LoanPolicyOptions.SectionName));
    builder.Services.AddHttpClient<IBookCatalogLookup, BookCatalogLookupClient>((sp, client) =>
        {
            var bookServiceUrl = sp.GetRequiredService<
                Microsoft.Extensions.Options.IOptions<BookCatalogOptions>>().Value.BookService;
            client.BaseAddress = new Uri(bookServiceUrl.TrimEnd('/') + "/");
        })
        .AddSpstResilienceTight();
    builder.Services.AddHttpClient<ILoanNotificationSender, HttpLoanNotificationSender>((sp, client) =>
        {
            var emailServiceUrl = sp.GetRequiredService<
                Microsoft.Extensions.Options.IOptions<EmailServiceOptions>>().Value.EmailService;
            client.BaseAddress = new Uri(emailServiceUrl.TrimEnd('/') + "/");
        })
        .AddSpstResilience();

    builder.Services.AddScoped<IBookingRepository, BookingRepository>();
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
    builder.Services.AddScoped<ILoanPolicyProvider, LoanPolicyProvider>();
    builder.Services.AddScoped<WaitlistService>();
    builder.Services.AddScoped<FavoritesService>();
    builder.Services.AddScoped<SchoolCalendarService>();
    builder.Services.AddScoped<BookingDtoEnricher>();
    builder.Services.AddScoped<LoanLifecycleService>();
    builder.Services.AddScoped<IBookingService, BookingAppService>();
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();
    builder.Services.AddSpstIntegrationMessaging(builder.Configuration, clientId: "booking-service");
    builder.Services.AddBookServiceEventHttpFallback(builder.Configuration);
    builder.Services.AddBookingIntegrationOutbox();

    builder.Services.AddSpstCaching(builder.Configuration, instanceName: "spst:");


    builder.Services.AddHealthChecks()
        .AddDbContextCheck<BookingDbContext>("database")
        .AddCheck<OutboxHealthCheck>("integration-outbox")
        .AddCheck<AuditOutboxHealthCheck>("audit-outbox");

    var app = builder.Build();

    Log.Information("Starting BookingService in {Environment} environment", app.Environment.EnvironmentName);

    await app.Services.MigrateSpstDatabaseAsync<BookingDbContext>(
        "BookingService",
        async (db, ct) =>
        {
            await LibraryOpsSchema.EnsureAsync(db, ct);
            await BookingSeed.EnsureSeededAsync(db);
        });

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSpstRequestLogging();
    app.UseSpstRequestMetrics();
    app.UseSpstSecurityHeaders();
    app.UseSpstCors();
    if (app.Environment.ShouldExposeSwagger())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "BookingService v1");
            options.RoutePrefix = "swagger";
        });
    }
    app.UseHttpsRedirection();
    app.UseSpstRateLimiting();
    app.UseSpstAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapSpstMetrics("BookingService");
    app.MapHealthChecks("/health").AllowAnonymous();

    Log.Information("BookingService is ready. Health: /health · Metrics: /metrics");
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

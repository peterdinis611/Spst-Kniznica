using BookingService.Clients;
using BookingService.Data;
using BookingService.Interfaces;
using BookingService.Middleware;
using BookingService.Repositories;
using BookingService.Services;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SpstKniznica.Caching;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;
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
    builder.Services.AddSpstAuditLogging();

    builder.Services.AddDbContext<BookingDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

    builder.Services.Configure<BookCatalogOptions>(
        builder.Configuration.GetSection(BookCatalogOptions.SectionName));
    builder.Services.AddHttpClient<IBookCatalogLookup, BookCatalogLookupClient>((sp, client) =>
    {
        var bookServiceUrl = sp.GetRequiredService<
            Microsoft.Extensions.Options.IOptions<BookCatalogOptions>>().Value.BookService;
        client.BaseAddress = new Uri(bookServiceUrl.TrimEnd('/') + "/");
        client.Timeout = TimeSpan.FromSeconds(3);
    });

    builder.Services.AddScoped<IBookingRepository, BookingRepository>();
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
    builder.Services.AddScoped<IBookingService, BookingAppService>();
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();
    builder.Services.AddKafkaIntegrationPublisher(builder.Configuration, clientId: "booking-service");
    builder.Services.AddSpstCaching(builder.Configuration, instanceName: "spst:");

    builder.Services.AddHealthChecks()
        .AddDbContextCheck<BookingDbContext>("database");

    var app = builder.Build();

    Log.Information("Starting BookingService in {Environment} environment", app.Environment.EnvironmentName);

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        await db.Database.MigrateAsync();
        await BookingSeed.EnsureSeededAsync(db);
        Log.Information("Database migrations applied; seed checked");
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSpstRequestLogging();
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
    app.MapHealthChecks("/health").AllowAnonymous();

    Log.Information("BookingService is ready. Health: /health");
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

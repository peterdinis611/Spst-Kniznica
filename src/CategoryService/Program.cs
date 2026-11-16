using CategoryService.Data;
using CategoryService.Interfaces;
using CategoryService.Middleware;
using CategoryService.Repositories;
using CategoryService.Services;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SpstKniznica.Caching;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Data;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Messaging;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("CategoryService");
    builder.UseSpstNetworkIsolation();

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "CategoryService API",
            Version = "v1",
            Description = "SPST knižnica – správa kategórií."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);
    builder.Services.AddSpstEntraAuthentication(builder.Configuration, builder.Environment);
    builder.Services.AddSpstApiRateLimiting(builder.Configuration);

    builder.Services.AddDbContext<CategoryDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))
            .AddInterceptors(new SqliteFoldConnectionInterceptor())
            .ConfigureSpstMigrations());

    builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
    builder.Services.AddScoped<ICategoryService, CategoryAppService>();
    builder.Services.AddHttpClient<IRelationBookCountLookup, RelationBookCountLookup>(client =>
    {
        var baseUrl = builder.Configuration["MessagingService:BaseUrl"] ?? "http://localhost:5205";
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        client.Timeout = TimeSpan.FromSeconds(5);
    });
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();
    builder.Services.AddKafkaIntegrationPublisher(builder.Configuration, clientId: "category-service");
    builder.Services.AddSpstCaching(builder.Configuration, instanceName: "spst:");
    builder.Services.AddSpstAuditLoggingToAdmin(builder.Configuration, sourceService: "CategoryService");

    builder.Services.AddHealthChecks()
        .AddDbContextCheck<CategoryDbContext>("database");

    var app = builder.Build();

    Log.Information("Starting CategoryService in {Environment} environment", app.Environment.EnvironmentName);

    await app.Services.MigrateSpstDatabaseAsync<CategoryDbContext>(
        "CategoryService",
        async (db, _) => await CategorySeed.EnsureSeededAsync(db));

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSpstRequestLogging();
    app.UseSpstCors();
    if (app.Environment.ShouldExposeSwagger())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "CategoryService v1");
            options.RoutePrefix = "swagger";
        });
    }

    app.UseHttpsRedirection();
    app.UseSpstRateLimiting();
    app.UseSpstAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health").AllowAnonymous();

    Log.Information("CategoryService is ready. Health: /health");
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

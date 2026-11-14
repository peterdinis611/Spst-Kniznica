using CategoryService.Data;
using CategoryService.Interfaces;
using CategoryService.Middleware;
using CategoryService.Repositories;
using CategoryService.Services;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SpstKniznica.Caching;
using SpstKniznica.Common.Hosting;
using SpstKniznica.Common.Messaging;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("CategoryService");

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

    builder.Services.AddDbContext<CategoryDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

    builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
    builder.Services.AddScoped<ICategoryService, CategoryAppService>();
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();
    builder.Services.AddKafkaIntegrationPublisher(builder.Configuration, clientId: "category-service");
    builder.Services.AddSpstCaching(builder.Configuration, instanceName: "spst:");

    builder.Services.AddHealthChecks()
        .AddDbContextCheck<CategoryDbContext>("database");

    var app = builder.Build();

    Log.Information("Starting CategoryService in {Environment} environment", app.Environment.EnvironmentName);

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<CategoryDbContext>();
        await db.Database.MigrateAsync();
        await CategorySeed.EnsureSeededAsync(db);
        Log.Information("Database migrations applied; seed checked");
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSpstRequestLogging();
    app.UseSpstCors();
    app.UseSpstSwagger("CategoryService v1");

    app.UseHttpsRedirection();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health");

    Log.Information("CategoryService is ready. Swagger: /swagger, Health: /health");
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

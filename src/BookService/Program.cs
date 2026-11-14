using BookService.Data;
using BookService.Interfaces;
using BookService.Messaging;
using BookService.Middleware;
using BookService.Repositories;
using BookService.Services;
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
    builder.UseSpstSerilog("BookService");

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "BookService API",
            Version = "v1",
            Description = "SPST knižnica – správa kníh, exemplárov a importu."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);

    builder.Services.AddDbContext<BookDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

    builder.Services.AddScoped<IBookRepository, BookRepository>();
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
    builder.Services.AddScoped<IBooksService, BooksService>();
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();
    builder.Services.AddKafkaIntegrationPublisher(builder.Configuration, clientId: "book-service");
    builder.Services.AddSpstCaching(builder.Configuration, instanceName: "spst:");
    builder.Services.AddHostedService<CategorySyncHostedService>();

    builder.Services.AddHttpClient<ICategoryLookup, CategoryLookupClient>(client =>
    {
        var baseUrl = builder.Configuration["CategoryService:BaseUrl"] ?? "http://localhost:5204";
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        client.Timeout = TimeSpan.FromSeconds(10);
    });

    builder.Services.AddHttpClient<IAuthorLookup, AuthorLookupClient>(client =>
    {
        var baseUrl = builder.Configuration["AuthorService:BaseUrl"] ?? "http://localhost:5207";
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        client.Timeout = TimeSpan.FromSeconds(10);
    });

    builder.Services.AddHealthChecks()
        .AddDbContextCheck<BookDbContext>("database");

    var app = builder.Build();

    Log.Information("Starting BookService in {Environment} environment", app.Environment.EnvironmentName);

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<BookDbContext>();
        await db.Database.MigrateAsync();
        await BookSeed.EnsureSeededAsync(db);
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
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "BookService v1");
            options.RoutePrefix = "swagger";
        });
    }

    app.UseHttpsRedirection();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health");

    Log.Information("BookService is ready. Swagger: /swagger, Health: /health");
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

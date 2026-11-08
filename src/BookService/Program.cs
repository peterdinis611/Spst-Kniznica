using BookService.Data;
using BookService.Interfaces;
using BookService.Middleware;
using BookService.Repositories;
using BookService.Services;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Serilog;
using SpstKniznica.Common.Messaging;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "BookService"));

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

    builder.Services.AddDbContext<BookDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

    builder.Services.AddScoped<IBookRepository, BookRepository>();
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
    builder.Services.AddScoped<IBooksService, BooksService>();
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();
    builder.Services.AddKafkaIntegrationPublisher(builder.Configuration, clientId: "book-service");

    builder.Services.AddHttpClient<ICategoryLookup, CategoryLookupClient>(client =>
    {
        var baseUrl = builder.Configuration["CategoryService:BaseUrl"] ?? "http://localhost:5204";
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
        Log.Information("Database migrations applied");
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();

    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate =
            "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.GetLevel = (httpContext, _, ex) =>
            ex is not null || httpContext.Response.StatusCode >= 500
                ? Serilog.Events.LogEventLevel.Error
                : httpContext.Response.StatusCode >= 400
                    ? Serilog.Events.LogEventLevel.Warning
                    : Serilog.Events.LogEventLevel.Information;
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString());
            diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString());
            diagnosticContext.Set("TraceId", httpContext.TraceIdentifier);
        };
    });

    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "BookService v1");
        options.RoutePrefix = "swagger";
    });

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

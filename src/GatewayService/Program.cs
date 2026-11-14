using Serilog;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Hosting;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.UseSpstSerilog("GatewayService");

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "GatewayService API",
            Version = "v1",
            Description = "SPST knižnica – API Gateway (YARP) pre Book, Category, Author, Booking, Workers, Messaging, Cache, Auth a Admin."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration, builder.Environment);
    builder.Services.AddSpstEntraAuthentication(builder.Configuration, builder.Environment);

    builder.Services
        .AddReverseProxy()
        .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

    builder.Services.AddHealthChecks();

    var app = builder.Build();

    Log.Information("Starting GatewayService in {Environment}", app.Environment.EnvironmentName);

    app.UseSpstRequestLogging();
    app.UseSpstCors();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "GatewayService v1");
            options.SwaggerEndpoint("/books/swagger/v1/swagger.json", "BookService");
            options.SwaggerEndpoint("/categories/swagger/v1/swagger.json", "CategoryService");
            options.SwaggerEndpoint("/authors/swagger/v1/swagger.json", "AuthorService");
            options.SwaggerEndpoint("/bookings/swagger/v1/swagger.json", "BookingService");
            options.SwaggerEndpoint("/workers/swagger/v1/swagger.json", "WorkersService");
            options.SwaggerEndpoint("/messaging/swagger/v1/swagger.json", "MessagingService");
            options.SwaggerEndpoint("/cache/swagger/v1/swagger.json", "CacheService");
            options.SwaggerEndpoint("/auth/swagger/v1/swagger.json", "AuthService");
            options.SwaggerEndpoint("/admin/swagger/v1/swagger.json", "AdminService");
            options.RoutePrefix = "swagger";
        });
    }

    app.UseSpstAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health").AllowAnonymous();
    if (app.Environment.IsDevelopment())
    {
        app.MapGet("/", () => Results.Redirect("/swagger")).AllowAnonymous();
    }
    else
    {
        app.MapGet("/", () => Results.Ok(new { service = "GatewayService", health = "/health" }))
            .AllowAnonymous();
    }

    app.MapReverseProxy();

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

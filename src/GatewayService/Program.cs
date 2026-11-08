using Serilog;
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
            Description = "SPST knižnica – API Gateway (YARP) pre Book, Category, Author, Booking, Messaging a Cache."
        });
    });
    builder.Services.AddSpstCors(builder.Configuration);

    builder.Services
        .AddReverseProxy()
        .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

    builder.Services.AddHealthChecks();

    var app = builder.Build();

    Log.Information("Starting GatewayService");

    app.UseSpstRequestLogging();
    app.UseSpstCors();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "GatewayService v1");
        options.SwaggerEndpoint("/books/swagger/v1/swagger.json", "BookService");
        options.SwaggerEndpoint("/categories/swagger/v1/swagger.json", "CategoryService");
        options.SwaggerEndpoint("/authors/swagger/v1/swagger.json", "AuthorService");
        options.SwaggerEndpoint("/bookings/swagger/v1/swagger.json", "BookingService");
        options.SwaggerEndpoint("/messaging/swagger/v1/swagger.json", "MessagingService");
        options.SwaggerEndpoint("/cache/swagger/v1/swagger.json", "CacheService");
        options.RoutePrefix = "swagger";
    });

    app.MapControllers();
    app.MapHealthChecks("/health");
    app.MapGet("/", () => Results.Redirect("/swagger"));
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

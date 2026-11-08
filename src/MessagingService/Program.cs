using MessagingService.Data;
using MessagingService.Interfaces;
using MessagingService.Messaging.Kafka;
using MessagingService.Messaging.RabbitMq;
using MessagingService.Options;
using MessagingService.Services;
using Microsoft.EntityFrameworkCore;
using Serilog;

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
        .Enrich.WithProperty("Application", "MessagingService"));

    builder.Services.Configure<KafkaOptions>(builder.Configuration.GetSection(KafkaOptions.SectionName));
    builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection(RabbitMqOptions.SectionName));

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "MessagingService API",
            Version = "v1",
            Description = "SPST knižnica – Kafka/RabbitMQ bridge a väzba kniha↔kategória (1:N)."
        });
    });

    builder.Services.AddDbContext<MessagingDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

    builder.Services.AddScoped<ILibraryRelationService, LibraryRelationService>();

    var kafkaEnabled = builder.Configuration.GetValue("Kafka:Enabled", true);
    var rabbitEnabled = builder.Configuration.GetValue("RabbitMq:Enabled", true);

    if (kafkaEnabled)
    {
        builder.Services.AddSingleton<KafkaEventPublisher>();
        builder.Services.AddSingleton<IEventPublisher>(sp => sp.GetRequiredService<KafkaEventPublisher>());
        builder.Services.AddHostedService<KafkaConsumerHostedService>();
    }

    if (rabbitEnabled)
    {
        builder.Services.AddSingleton<RabbitMqEventPublisher>();
        builder.Services.AddSingleton<IEventPublisher>(sp => sp.GetRequiredService<RabbitMqEventPublisher>());
        builder.Services.AddHostedService<RabbitMqConsumerHostedService>();
    }

    builder.Services.AddHealthChecks()
        .AddDbContextCheck<MessagingDbContext>("database");

    var app = builder.Build();

    Log.Information(
        "Starting MessagingService. Kafka={KafkaEnabled}, RabbitMQ={RabbitEnabled}",
        kafkaEnabled,
        rabbitEnabled);

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<MessagingDbContext>();
        await db.Database.MigrateAsync();
        Log.Information("Messaging projection database migrations applied");
    }

    app.UseSerilogRequestLogging();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "MessagingService v1");
        options.RoutePrefix = "swagger";
    });

    app.UseHttpsRedirection();
    app.MapControllers();
    app.MapHealthChecks("/health");

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

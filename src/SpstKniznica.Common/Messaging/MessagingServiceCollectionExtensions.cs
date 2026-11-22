using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SpstKniznica.Common.Hosting;

namespace SpstKniznica.Common.Messaging;

public static class MessagingServiceCollectionExtensions
{
    /// <summary>
    /// Registers Kafka and/or RabbitMQ publishers as a composite <see cref="IIntegrationEventPublisher"/>.
    /// </summary>
    public static IServiceCollection AddSpstIntegrationMessaging(
        this IServiceCollection services,
        IConfiguration configuration,
        string? clientId = null)
    {
        services.Configure<KafkaPublisherOptions>(configuration.GetSection(KafkaPublisherOptions.SectionName));
        services.Configure<RabbitMqPublisherOptions>(configuration.GetSection(RabbitMqPublisherOptions.SectionName));

        if (!string.IsNullOrWhiteSpace(clientId))
        {
            services.PostConfigure<KafkaPublisherOptions>(options => options.ClientId = clientId);
            services.PostConfigure<RabbitMqPublisherOptions>(options => options.ClientName = clientId);
        }

        var kafkaEnabled = configuration.GetValue($"{KafkaPublisherOptions.SectionName}:Enabled", true);
        var rabbitEnabled = configuration.GetValue($"{RabbitMqPublisherOptions.SectionName}:Enabled", true);

        ValidateSigningRequired(configuration, KafkaPublisherOptions.SectionName, kafkaEnabled);
        ValidateSigningRequired(configuration, RabbitMqPublisherOptions.SectionName, rabbitEnabled);

        if (kafkaEnabled)
        {
            services.AddSingleton<KafkaIntegrationEventPublisher>();
        }

        if (rabbitEnabled)
        {
            services.AddSingleton<RabbitMqIntegrationEventPublisher>();
        }

        if (!kafkaEnabled && !rabbitEnabled)
        {
            services.AddSingleton<NullIntegrationEventPublisher>();
        }

        services.AddSingleton<IIntegrationEventPublisher>(sp => BuildComposite(sp, kafkaEnabled, rabbitEnabled));

        return services;
    }

    /// <summary>Backward-compatible alias — prefers dual Kafka + RabbitMQ when configured.</summary>
    public static IServiceCollection AddKafkaIntegrationPublisher(
        this IServiceCollection services,
        IConfiguration configuration,
        string? clientId = null)
        => services.AddSpstIntegrationMessaging(configuration, clientId);

    /// <summary>
    /// Dual-write booking/catalog events to BookService over HTTP (default on).
    /// Brokers stay for other consumers; HTTP keeps copy availability in sync without waiting for Kafka.
    /// Disable with <c>BookService:HttpEventSync=false</c>.
    /// </summary>
    public static IServiceCollection AddBookServiceEventHttpFallback(
        this IServiceCollection services,
        IConfiguration configuration,
        string? bookServiceBaseUrl = null)
    {
        var kafkaEnabled = configuration.GetValue($"{KafkaPublisherOptions.SectionName}:Enabled", true);
        var rabbitEnabled = configuration.GetValue($"{RabbitMqPublisherOptions.SectionName}:Enabled", true);
        var httpSync = configuration.GetValue("BookService:HttpEventSync", true);

        if (httpSync)
        {
            var baseUrl = (bookServiceBaseUrl
                    ?? configuration["BookService:BaseUrl"]
                    ?? configuration["Services:BookService"]
                    ?? "http://127.0.0.1:5203")
                .TrimEnd('/');

            services.AddHttpClient<BookServiceEventHttpNotifier>(client =>
                {
                    client.BaseAddress = new Uri(baseUrl + "/");
                })
                .AddSpstResilience(attemptTimeoutSeconds: 5, totalTimeoutSeconds: 20, maxRetryAttempts: 3);
        }

        // Always register Fanout so callers can decorate it (e.g. BookingService outbox).
        // When HttpEventSync=false the notifier is absent and Fanout skips HTTP.
        services.AddSingleton<FanoutIntegrationEventPublisher>(sp =>
        {
            var primary = BuildComposite(sp, kafkaEnabled, rabbitEnabled);
            return new FanoutIntegrationEventPublisher(
                primary,
                sp.GetRequiredService<IServiceScopeFactory>(),
                sp.GetRequiredService<ILogger<FanoutIntegrationEventPublisher>>());
        });
        services.AddSingleton<IIntegrationEventPublisher>(sp =>
            sp.GetRequiredService<FanoutIntegrationEventPublisher>());

        return services;
    }

    private static void ValidateSigningRequired(
        IConfiguration configuration,
        string sectionName,
        bool enabled)
    {
        if (!enabled)
        {
            return;
        }

        var requireSigning = configuration.GetValue($"{sectionName}:RequireSigning", false);
        if (!requireSigning)
        {
            return;
        }

        var secret = configuration[$"{sectionName}:SigningSecret"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException(
                $"{sectionName}:RequireSigning is true but SigningSecret is empty.");
        }
    }

    private static IIntegrationEventPublisher BuildComposite(
        IServiceProvider sp,
        bool kafkaEnabled,
        bool rabbitEnabled)
    {
        var transports = new List<IIntegrationEventPublisher>();

        if (kafkaEnabled && sp.GetService<KafkaIntegrationEventPublisher>() is { } kafka)
        {
            transports.Add(kafka);
        }

        if (rabbitEnabled && sp.GetService<RabbitMqIntegrationEventPublisher>() is { } rabbit)
        {
            transports.Add(rabbit);
        }

        if (transports.Count == 0)
        {
            transports.Add(
                sp.GetService<NullIntegrationEventPublisher>()
                ?? new NullIntegrationEventPublisher());
        }

        return new CompositeIntegrationEventPublisher(
            transports,
            sp.GetRequiredService<ILogger<CompositeIntegrationEventPublisher>>());
    }
}

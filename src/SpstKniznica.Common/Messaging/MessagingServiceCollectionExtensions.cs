using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace SpstKniznica.Common.Messaging;

public static class MessagingServiceCollectionExtensions
{
    public static IServiceCollection AddKafkaIntegrationPublisher(
        this IServiceCollection services,
        IConfiguration configuration,
        string? clientId = null)
    {
        services.Configure<KafkaPublisherOptions>(configuration.GetSection(KafkaPublisherOptions.SectionName));

        if (!string.IsNullOrWhiteSpace(clientId))
        {
            services.PostConfigure<KafkaPublisherOptions>(options => options.ClientId = clientId);
        }

        var enabled = configuration.GetValue($"{KafkaPublisherOptions.SectionName}:Enabled", true);
        if (enabled)
        {
            services.AddSingleton<KafkaIntegrationEventPublisher>();
            services.AddSingleton<IIntegrationEventPublisher>(sp =>
                sp.GetRequiredService<KafkaIntegrationEventPublisher>());
        }
        else
        {
            services.AddSingleton<NullIntegrationEventPublisher>();
            services.AddSingleton<IIntegrationEventPublisher>(sp =>
                sp.GetRequiredService<NullIntegrationEventPublisher>());
        }

        return services;
    }

    /// <summary>
    /// After Kafka/null publish, POST relevant events to BookService (dev-friendly when Kafka is off).
    /// </summary>
    public static IServiceCollection AddBookServiceEventHttpFallback(
        this IServiceCollection services,
        IConfiguration configuration,
        string? bookServiceBaseUrl = null)
    {
        var baseUrl = (bookServiceBaseUrl
                ?? configuration["BookService:BaseUrl"]
                ?? configuration["Services:BookService"]
                ?? "http://127.0.0.1:5203")
            .TrimEnd('/');

        services.AddHttpClient<BookServiceEventHttpNotifier>(client =>
        {
            client.BaseAddress = new Uri(baseUrl + "/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddSingleton<IIntegrationEventPublisher>(sp =>
        {
            IIntegrationEventPublisher primary =
                sp.GetService<KafkaIntegrationEventPublisher>()
                ?? (IIntegrationEventPublisher)sp.GetRequiredService<NullIntegrationEventPublisher>();

            return new FanoutIntegrationEventPublisher(
                primary,
                sp.GetRequiredService<IServiceScopeFactory>(),
                sp.GetRequiredService<ILogger<FanoutIntegrationEventPublisher>>());
        });

        return services;
    }
}

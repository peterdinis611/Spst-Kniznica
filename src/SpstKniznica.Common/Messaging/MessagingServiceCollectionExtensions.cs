using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

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
            services.AddSingleton<IIntegrationEventPublisher, KafkaIntegrationEventPublisher>();
        }
        else
        {
            services.AddSingleton<IIntegrationEventPublisher, NullIntegrationEventPublisher>();
        }

        return services;
    }
}

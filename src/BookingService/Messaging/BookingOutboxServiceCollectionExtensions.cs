using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SpstKniznica.Common.Messaging;

namespace BookingService.Messaging;

public static class BookingOutboxServiceCollectionExtensions
{
    public static IServiceCollection AddBookingIntegrationOutbox(this IServiceCollection services)
    {
        services.AddHostedService<OutboxDispatchHostedService>();
        services.AddSingleton<IIntegrationEventPublisher>(sp =>
            new OutboxIntegrationEventPublisher(
                sp.GetRequiredService<FanoutIntegrationEventPublisher>(),
                sp.GetRequiredService<IServiceScopeFactory>(),
                sp.GetRequiredService<ILogger<OutboxIntegrationEventPublisher>>()));
        return services;
    }
}

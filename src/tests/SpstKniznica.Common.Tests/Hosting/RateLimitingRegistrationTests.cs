using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Hosting;

namespace SpstKniznica.Common.Tests.Hosting;

public class RateLimitingRegistrationTests
{
    [Fact]
    public void Registers_rate_limiting_options_from_configuration()
    {
        var services = new ServiceCollection();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["RateLimiting:EnableGlobalLimiter"] = "true",
                ["RateLimiting:GlobalPermitLimit"] = "50",
                ["RateLimiting:SensitiveWritePermitLimit"] = "10",
            })
            .Build();

        services.AddLogging();
        services.AddSpstApiRateLimiting(config);

        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<RateLimitingOptions>>().Value;

        options.EnableGlobalLimiter.Should().BeTrue();
        options.GlobalPermitLimit.Should().Be(50);
        options.SensitiveWritePermitLimit.Should().Be(10);

        var act = () => new ApplicationBuilder(provider).UseSpstRateLimiting();
        act.Should().NotThrow();
    }
}

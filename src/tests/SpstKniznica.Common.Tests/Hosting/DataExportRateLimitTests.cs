using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Hosting;

namespace SpstKniznica.Common.Tests.Hosting;

public class DataExportRateLimitTests
{
    [Fact]
    public void Registers_data_export_limits_from_configuration()
    {
        var services = new ServiceCollection();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["RateLimiting:DataExportPermitLimit"] = "5",
                ["RateLimiting:DataExportWindowSeconds"] = "30",
            })
            .Build();

        services.AddLogging();
        services.AddSpstApiRateLimiting(config);

        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<RateLimitingOptions>>().Value;

        options.DataExportPermitLimit.Should().Be(5);
        options.DataExportWindowSeconds.Should().Be(30);
        RateLimitingServiceCollectionExtensions.DataExportPolicy.Should().Be("data-export");
    }
}

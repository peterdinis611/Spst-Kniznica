using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Tests.Auth;

public class EntraAuthRegistrationTests
{
    [Fact]
    public void Disallows_development_auth_outside_Development()
    {
        var services = new ServiceCollection();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Entra:Enabled"] = "false",
            })
            .Build();

        var act = () => services.AddSpstEntraAuthentication(
            config,
            new FakeHostEnvironment(Environments.Production));

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*DevelopmentAuthHandler*");
    }

    [Fact]
    public void Allows_development_auth_in_Development()
    {
        var services = new ServiceCollection();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Entra:Enabled"] = "false",
            })
            .Build();

        var act = () => services.AddSpstEntraAuthentication(
            config,
            new FakeHostEnvironment(Environments.Development));

        act.Should().NotThrow();
    }

    private sealed class FakeHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "tests";
        public string ContentRootPath { get; set; } = ".";
        public IFileProvider ContentRootFileProvider { get; set; } =
            new NullFileProvider();
    }
}

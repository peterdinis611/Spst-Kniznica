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

    [Fact]
    public void Rejects_insecure_default_internal_key_without_explicit_opt_in()
    {
        var services = new ServiceCollection();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Entra:Enabled"] = "false",
                ["InternalApi:SharedKey"] = "spst-dev-internal-key-change-me",
                ["InternalApi:AllowInsecureDefaultKey"] = "false",
            })
            .Build();

        var act = () => services.AddSpstEntraAuthentication(
            config,
            new FakeHostEnvironment(Environments.Development));

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*AllowInsecureDefaultKey*");
    }

    [Fact]
    public void Rejects_default_internal_key_outside_Development()
    {
        var services = new ServiceCollection();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Entra:Enabled"] = "true",
                ["Entra:TenantId"] = "tenant",
                ["Entra:ClientId"] = "client",
                ["Entra:Audience"] = "api://client",
                ["InternalApi:SharedKey"] = "spst-dev-internal-key-change-me",
                ["InternalApi:AllowInsecureDefaultKey"] = "true",
            })
            .Build();

        var act = () => services.AddSpstEntraAuthentication(
            config,
            new FakeHostEnvironment(Environments.Production));

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*InternalApi:SharedKey*");
    }

    [Fact]
    public void Rejects_grant_staff_in_development_outside_Development()
    {
        var services = new ServiceCollection();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Entra:Enabled"] = "true",
                ["Entra:TenantId"] = "tenant",
                ["Entra:ClientId"] = "client",
                ["Entra:Audience"] = "api://client",
                ["Entra:GrantStaffInDevelopment"] = "true",
                ["InternalApi:SharedKey"] = "production-grade-internal-api-key-32",
            })
            .Build();

        var act = () => services.AddSpstEntraAuthentication(
            config,
            new FakeHostEnvironment(Environments.Production));

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*GrantStaffInDevelopment*");
    }

    [Fact]
    public void Rejects_short_internal_key_outside_Development()
    {
        var services = new ServiceCollection();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Entra:Enabled"] = "true",
                ["Entra:TenantId"] = "tenant",
                ["Entra:ClientId"] = "client",
                ["Entra:Audience"] = "api://client",
                ["InternalApi:SharedKey"] = "too-short-key",
            })
            .Build();

        var act = () => services.AddSpstEntraAuthentication(
            config,
            new FakeHostEnvironment(Environments.Production));

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*32 characters*");
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

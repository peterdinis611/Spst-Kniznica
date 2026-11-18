using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Tests.Auth;

public class AuthPolicyRegistrationTests
{
    [Fact]
    public void Registers_staff_admin_authenticated_and_internal_policies()
    {
        var services = new ServiceCollection();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Entra:Enabled"] = "false",
                ["InternalApi:SharedKey"] = "test-key-not-default",
            })
            .Build();

        services.AddSpstEntraAuthentication(
            config,
            new FakeHostEnvironment(Environments.Development));

        using var sp = services.BuildServiceProvider();
        var options = sp.GetRequiredService<IOptions<AuthorizationOptions>>().Value;

        options.GetPolicy(AuthPolicies.Authenticated).Should().NotBeNull();
        options.GetPolicy(AuthPolicies.Staff).Should().NotBeNull();
        options.GetPolicy(AuthPolicies.AdminOnly).Should().NotBeNull();
        options.GetPolicy(AuthPolicies.InternalService).Should().NotBeNull();

        options.GetPolicy(AuthPolicies.Staff)!.Requirements
            .Should().ContainSingle(r => r.GetType().Name.Contains("Roles", StringComparison.Ordinal));
        options.GetPolicy(AuthPolicies.AdminOnly)!.Requirements
            .Should().ContainSingle(r => r.GetType().Name.Contains("Roles", StringComparison.Ordinal));
    }

    private sealed class FakeHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "tests";
        public string ContentRootPath { get; set; } = ".";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}

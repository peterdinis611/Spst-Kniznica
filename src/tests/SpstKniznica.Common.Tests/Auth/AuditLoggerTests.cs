using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Tests.Auth;

public class AuditLoggerTests
{
    [Fact]
    public void StaffAction_writes_entry_with_hashed_actor_and_roles()
    {
        var sink = new RecordingAuditSink();
        var sut = CreateLogger(sink);

        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, "oid-123"),
            new Claim(ClaimTypes.Email, "librarian@spst.sk"),
            new Claim(ClaimTypes.Name, "Ján Kováč"),
            new Claim(ClaimTypes.Role, AppRoles.Librarian),
            new Claim(ClaimTypes.Role, AppRoles.Reader),
        ], authenticationType: "test"));

        sut.StaffAction(user, "book.create", "Book", "abc", new { Title = "Test" });

        sink.Entries.Should().ContainSingle();
        var entry = sink.Entries[0];
        entry.Action.Should().Be("book.create");
        entry.EntityType.Should().Be("Book");
        entry.EntityId.Should().Be("abc");
        entry.ActorEmail.Should().Be("librarian@spst.sk");
        entry.ActorName.Should().Be("Ján Kováč");
        entry.ActorIdHash.Should().Be(LogRedaction.HashForLog("oid-123"));
        entry.Roles.Should().Contain(AppRoles.Librarian);
        entry.DetailsJson.Should().Contain("Test");
    }

    [Fact]
    public void ServiceAction_uses_system_actor_and_internal_role()
    {
        var sink = new RecordingAuditSink();
        var sut = CreateLogger(sink);

        sut.ServiceAction("email.send", "EmailMessage", Guid.NewGuid().ToString(), new { Status = "Sent" });

        sink.Entries.Should().ContainSingle();
        var entry = sink.Entries[0];
        entry.ActorName.Should().Be("system");
        entry.ActorEmail.Should().BeNull();
        entry.Roles.Should().Be(AuthPolicies.InternalService);
        entry.DetailsJson.Should().Contain("Sent");
    }

    [Fact]
    public void StaffAction_does_not_throw_when_sink_fails()
    {
        var sut = CreateLogger(new ThrowingAuditSink());
        var user = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, "oid"),
            new Claim(ClaimTypes.Role, AppRoles.Admin),
        ], "test"));

        var act = () => sut.StaffAction(user, "audit.export", "AuditLog", "csv");

        act.Should().NotThrow();
    }

    private static AuditLogger CreateLogger(IAuditSink sink)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(sink);
        var sp = services.BuildServiceProvider();
        return new AuditLogger(
            sp.GetRequiredService<ILoggerFactory>().CreateLogger<AuditLogger>(),
            sp.GetRequiredService<IServiceScopeFactory>());
    }

    private sealed class RecordingAuditSink : IAuditSink
    {
        public List<AuditEntry> Entries { get; } = [];

        public Task WriteAsync(AuditEntry entry, CancellationToken cancellationToken = default)
        {
            Entries.Add(entry);
            return Task.CompletedTask;
        }
    }

    private sealed class ThrowingAuditSink : IAuditSink
    {
        public Task WriteAsync(AuditEntry entry, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException("sink down");
    }
}

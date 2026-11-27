using FluentAssertions;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Tests.Auth;

public class FileAuditOutboxTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "spst-audit-" + Guid.NewGuid().ToString("N"));
    private readonly FileAuditOutbox _sut;

    public FileAuditOutboxTests()
    {
        Directory.CreateDirectory(_root);
        _sut = new FileAuditOutbox(new FakeHostEnvironment(_root));
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_root))
            {
                Directory.Delete(_root, recursive: true);
            }
        }
        catch
        {
            // best-effort cleanup
        }
    }

    [Fact]
    public void DequeueBatch_is_atomic_against_requeue()
    {
        _sut.Enqueue(Entry("a"));
        _sut.Enqueue(Entry("b"));
        _sut.Enqueue(Entry("c"));

        var batch = _sut.DequeueBatch(2);
        batch.Should().HaveCount(2);
        _sut.Count().Should().Be(1);

        _sut.Requeue(batch);
        _sut.Count().Should().Be(3);
    }

    private static AuditEntry Entry(string action) => new()
    {
        Action = action,
        EntityType = "Book",
        EntityId = Guid.NewGuid().ToString("N"),
    };

    private sealed class FakeHostEnvironment(string root) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "tests";
        public string ContentRootPath { get; set; } = root;
        public IFileProvider ContentRootFileProvider { get; set; } =
            new PhysicalFileProvider(root);
    }
}

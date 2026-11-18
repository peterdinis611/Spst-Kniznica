using AdminService.Data;
using AdminService.DTOs;
using AdminService.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SpstKniznica.Common.Auth;
using SpstKniznica.Common.Export;

namespace AdminService.Tests.Services;

public class AuditLogServiceTests : IAsyncLifetime
{
    private AdminDbContext _db = null!;
    private AuditLogService _sut = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<AdminDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _db = new AdminDbContext(options);
        await _db.Database.OpenConnectionAsync();
        await _db.Database.EnsureCreatedAsync();
        _sut = new AuditLogService(_db, NullLogger<AuditLogService>.Instance);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
    }

    [Fact]
    public async Task WriteAsync_truncates_long_details_json()
    {
        var longDetails = new string('x', 5000);

        await _sut.WriteAsync(new AuditEntry
        {
            Action = "book.export",
            EntityType = "Book",
            EntityId = "all",
            Roles = "Admin",
            DetailsJson = longDetails,
            ActorEmail = "admin@spst.sk",
            SourceService = "BookService",
        });

        var stored = await _db.AuditLogs.SingleAsync();
        stored.DetailsJson.Should().HaveLength(4000);
        stored.Action.Should().Be("book.export");
    }

    [Fact]
    public async Task SearchAsync_filters_by_action_and_actor_email()
    {
        await SeedAsync("book.create", "reader@spst.sk");
        await SeedAsync("book.export", "admin@spst.sk");
        await SeedAsync("book.export", "other@spst.sk");

        var result = await _sut.SearchAsync(new AuditLogQuery
        {
            Action = "book.export",
            ActorEmail = "Admin@SPST.SK",
            Page = 1,
            PageSize = 20,
        });

        result.TotalCount.Should().Be(1);
        result.Items.Should().ContainSingle()
            .Which.ActorEmail.Should().Be("admin@spst.sk");
    }

    [Fact]
    public async Task ListForExportAsync_respects_take_cap()
    {
        for (var i = 0; i < 5; i++)
        {
            await SeedAsync("book.create", $"u{i}@spst.sk");
        }

        var exported = await _sut.ListForExportAsync(
            new AuditLogQuery(),
            take: 2);

        exported.Should().HaveCount(2);

        var capped = await _sut.ListForExportAsync(
            new AuditLogQuery(),
            take: ExportLimits.MaxTake + 100);
        capped.Count.Should().BeLessThanOrEqualTo(5);
    }

    [Fact]
    public async Task IngestAsync_persists_payload()
    {
        await _sut.IngestAsync(new IngestAuditRequest
        {
            Action = "auth.login",
            EntityType = "User",
            EntityId = "oid",
            ActorEmail = "u@spst.sk",
            Roles = "Reader",
            SourceService = "AuthService",
        });

        var found = await _sut.SearchAsync(new AuditLogQuery
        {
            Action = "auth.login",
            Page = 1,
            PageSize = 10,
        });
        found.TotalCount.Should().Be(1);
        found.Items[0].SourceService.Should().Be("AuthService");
    }

    private async Task SeedAsync(string action, string email)
    {
        await _sut.WriteAsync(new AuditEntry
        {
            Action = action,
            EntityType = "Book",
            EntityId = Guid.NewGuid().ToString("N"),
            ActorEmail = email,
            Roles = "Admin",
            SourceService = "BookService",
            OccurredAt = DateTimeOffset.UtcNow,
        });
    }
}

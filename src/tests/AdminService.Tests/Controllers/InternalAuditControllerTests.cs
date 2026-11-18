using AdminService.Controllers;
using AdminService.Data;
using AdminService.DTOs;
using AdminService.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace AdminService.Tests.Controllers;

public class InternalAuditControllerTests : IAsyncLifetime
{
    private AdminDbContext _db = null!;
    private InternalAuditController _sut = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<AdminDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _db = new AdminDbContext(options);
        await _db.Database.OpenConnectionAsync();
        await _db.Database.EnsureCreatedAsync();
        var service = new AuditLogService(_db, NullLogger<AuditLogService>.Instance);
        _sut = new InternalAuditController(service);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
    }

    [Fact]
    public async Task Ingest_returns_bad_request_when_action_missing()
    {
        var result = await _sut.Ingest(
            new IngestAuditRequest
            {
                Action = " ",
                EntityType = "EmailMessage",
                EntityId = Guid.NewGuid().ToString(),
            },
            CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
        (await _db.AuditLogs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Ingest_returns_no_content_on_valid_email_payload()
    {
        var id = Guid.NewGuid();
        var result = await _sut.Ingest(
            new IngestAuditRequest
            {
                Id = id,
                Action = "email.send",
                EntityType = "EmailMessage",
                EntityId = id.ToString(),
                ActorName = "system",
                Roles = "InternalService",
                SourceService = "EmailService",
                DetailsJson = """{"templateKey":"ops.notice","status":"Sent","toDomain":"spst.sk"}""",
            },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        var stored = await _db.AuditLogs.SingleAsync();
        stored.Action.Should().Be("email.send");
        stored.SourceService.Should().Be("EmailService");
        stored.DetailsJson.Should().Contain("spst.sk");
    }
}

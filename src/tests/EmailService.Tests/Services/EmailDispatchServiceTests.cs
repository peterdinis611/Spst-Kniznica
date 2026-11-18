using System.Text.Json;
using EmailService.Data;
using EmailService.DTOs;
using EmailService.Models;
using EmailService.Options;
using EmailService.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace EmailService.Tests.Services;

public class EmailDispatchServiceTests : IAsyncLifetime
{
    private EmailDbContext _db = null!;
    private RecordingAuditLogger _audit = null!;
    private StubTransport _transport = null!;
    private EmailDispatchService _sut = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<EmailDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _db = new EmailDbContext(options);
        await _db.Database.OpenConnectionAsync();
        await _db.Database.EnsureCreatedAsync();

        _audit = new RecordingAuditLogger();
        _transport = new StubTransport(isLive: false);
        _sut = CreateSut(new EmailDispatchOptions
        {
            RequireTemplateKeyForRawSend = true,
            MaxSendsPerMinute = 30,
            AllowedRecipientDomains = ["spst.sk"],
        });
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
    }

    [Fact]
    public async Task SendAsync_persists_logged_only_and_audits_email_send()
    {
        var dto = await _sut.SendAsync(ValidRequest());

        dto.Status.Should().Be(EmailDeliveryStatus.LoggedOnly);
        dto.ToAddress.Should().Be("reader@spst.sk");
        _audit.ServiceActions.Should().ContainSingle(a => a.Action == "email.send");
        var entry = _audit.ServiceActions[0];
        entry.EntityType.Should().Be("EmailMessage");
        entry.EntityId.Should().Be(dto.Id.ToString());
        entry.DetailsJson.Should().Contain("spst.sk");
        entry.DetailsJson.Should().Contain("log-only");
        entry.DetailsJson.Should().Contain("LoggedOnly");
    }

    [Fact]
    public async Task SendAsync_audits_smtp_sent_when_transport_is_live()
    {
        _transport = new StubTransport(isLive: true);
        _sut = CreateSut(new EmailDispatchOptions
        {
            RequireTemplateKeyForRawSend = true,
            AllowedRecipientDomains = ["spst.sk"],
        });

        var dto = await _sut.SendAsync(ValidRequest());

        dto.Status.Should().Be(EmailDeliveryStatus.Sent);
        _audit.ServiceActions.Should().ContainSingle(a => a.Action == "email.send");
        _audit.ServiceActions[0].DetailsJson.Should().Contain("smtp");
        _audit.ServiceActions[0].DetailsJson.Should().Contain("Sent");
    }

    [Fact]
    public async Task SendAsync_audits_email_failed_when_transport_throws()
    {
        _transport = new StubTransport(isLive: true, failWith: new InvalidOperationException("SMTP down"));
        _sut = CreateSut(new EmailDispatchOptions
        {
            RequireTemplateKeyForRawSend = true,
            AllowedRecipientDomains = ["spst.sk"],
        });

        var act = async () => await _sut.SendAsync(ValidRequest());

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("SMTP down");
        var stored = await _db.Messages.SingleAsync();
        stored.Status.Should().Be(EmailDeliveryStatus.Failed);
        stored.Error.Should().Contain("SMTP down");
        _audit.ServiceActions.Should().ContainSingle(a => a.Action == "email.failed");
        _audit.ServiceActions[0].DetailsJson.Should().Contain("Failed");
        _audit.ServiceActions[0].DetailsJson.Should().Contain("SMTP down");
    }

    [Fact]
    public async Task SendLoanDueReminderAsync_audits_template_action()
    {
        var dto = await _sut.SendLoanDueReminderAsync(new LoanEmailTemplateRequest
        {
            BookingId = Guid.NewGuid(),
            BookId = Guid.NewGuid(),
            BorrowerEmail = "reader@spst.sk",
            BorrowerName = "Peter",
            DueDate = DateTimeOffset.UtcNow.AddDays(2),
            BookTitle = "Motor",
        });

        dto.TemplateKey.Should().Be("loan-due-reminder");
        _audit.ServiceActions.Should().ContainSingle(a =>
            a.Action == "email.template.loan-due-reminder");
    }

    [Fact]
    public async Task SendWaitlistPromotionAsync_audits_template_action()
    {
        var dto = await _sut.SendWaitlistPromotionAsync(new LoanEmailTemplateRequest
        {
            BookingId = Guid.NewGuid(),
            BookId = Guid.NewGuid(),
            BorrowerEmail = "reader@spst.sk",
            BorrowerName = "Peter",
            DueDate = DateTimeOffset.UtcNow.AddDays(1),
            BookTitle = "Motor",
        });

        dto.TemplateKey.Should().Be("waitlist-promotion");
        _audit.ServiceActions.Should().ContainSingle(a =>
            a.Action == "email.template.waitlist-promotion");
    }

    [Fact]
    public async Task SendAsync_rejects_disallowed_domain_without_audit()
    {
        var act = async () => await _sut.SendAsync(ValidRequest(to: "user@gmail.com"));

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*AllowedRecipientDomains*");
        _audit.ServiceActions.Should().BeEmpty();
        (await _db.Messages.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SendAsync_requires_template_key_when_policy_enabled()
    {
        var request = ValidRequest();
        request.TemplateKey = null;

        var act = async () => await _sut.SendAsync(request);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*TemplateKey*");
        _audit.ServiceActions.Should().BeEmpty();
    }

    [Fact]
    public async Task SendAsync_enforces_max_sends_per_minute()
    {
        _sut = CreateSut(new EmailDispatchOptions
        {
            RequireTemplateKeyForRawSend = true,
            MaxSendsPerMinute = 1,
            AllowedRecipientDomains = ["spst.sk"],
        });

        await _sut.SendAsync(ValidRequest());
        _audit.ServiceActions.Clear();

        var act = async () => await _sut.SendAsync(ValidRequest(templateKey: "other"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*rate limit*");
        _audit.ServiceActions.Should().BeEmpty();
    }

    [Fact]
    public async Task ListRecentAsync_returns_newest_first_within_take()
    {
        _db.Messages.AddRange(
            new EmailMessageLog
            {
                Id = Guid.NewGuid(),
                ToAddress = "a@spst.sk",
                Subject = "old",
                BodyText = "x",
                TemplateKey = "first",
                Status = EmailDeliveryStatus.Sent,
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-5),
            },
            new EmailMessageLog
            {
                Id = Guid.NewGuid(),
                ToAddress = "b@spst.sk",
                Subject = "new",
                BodyText = "x",
                TemplateKey = "second",
                Status = EmailDeliveryStatus.Sent,
                CreatedAt = DateTimeOffset.UtcNow,
            });
        await _db.SaveChangesAsync();

        var recent = await _sut.ListRecentAsync(1);

        recent.Should().ContainSingle();
        recent[0].TemplateKey.Should().Be("second");
    }

    private EmailDispatchService CreateSut(EmailDispatchOptions dispatch) =>
        new(
            _db,
            _transport,
            Microsoft.Extensions.Options.Options.Create(new SmtpOptions
            {
                Enabled = _transport.IsLive,
                FromAddress = "kniznica@spst.sk",
                Host = "localhost",
                Port = 25,
            }),
            Microsoft.Extensions.Options.Options.Create(dispatch),
            _audit,
            NullLogger<EmailDispatchService>.Instance);

    private static SendEmailRequest ValidRequest(
        string to = "reader@spst.sk",
        string? templateKey = "ops.notice") => new()
    {
        To = to,
        ToName = "Reader",
        Subject = "Test subject",
        BodyText = "Hello",
        TemplateKey = templateKey,
        CorrelationId = "corr-1",
    };

    private sealed class StubTransport(bool isLive, Exception? failWith = null) : IEmailTransport
    {
        public bool IsLive { get; } = isLive;

        public Task SendAsync(OutboundEmail email, CancellationToken cancellationToken = default)
        {
            if (failWith is not null)
            {
                throw failWith;
            }

            return Task.CompletedTask;
        }
    }

    private sealed class RecordingAuditLogger : IAuditLogger
    {
        public List<RecordedAction> ServiceActions { get; } = [];

        public void StaffAction(
            System.Security.Claims.ClaimsPrincipal user,
            string action,
            string entityType,
            string entityId,
            object? details = null)
        {
        }

        public void ServiceAction(
            string action,
            string entityType,
            string entityId,
            object? details = null)
        {
            ServiceActions.Add(new RecordedAction(
                action,
                entityType,
                entityId,
                details is null
                    ? null
                    : JsonSerializer.Serialize(details, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    })));
        }
    }

    private sealed record RecordedAction(
        string Action,
        string EntityType,
        string EntityId,
        string? DetailsJson);
}

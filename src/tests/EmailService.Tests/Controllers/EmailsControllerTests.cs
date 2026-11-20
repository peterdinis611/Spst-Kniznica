using EmailService.Controllers;
using EmailService.DTOs;
using EmailService.Models;
using EmailService.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using SpstKniznica.Common.Auth;

namespace EmailService.Tests.Controllers;

public class EmailsControllerTests
{
    private readonly IEmailDispatchService _emails = Substitute.For<IEmailDispatchService>();
    private readonly IAuditLogger _audit = Substitute.For<IAuditLogger>();

    private EmailsController CreateSut() => new(_emails, _audit);

    [Fact]
    public async Task Status_returns_service_status()
    {
        _emails.GetStatusAsync(Arg.Any<CancellationToken>())
            .Returns(new EmailServiceStatusDto
            {
                SmtpEnabled = false,
                FromAddress = "library@spst.sk",
                Host = "localhost",
                Port = 25,
                RecentCount = 2,
            });

        var result = await CreateSut().Status(CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<EmailServiceStatusDto>().Subject;
        dto.RecentCount.Should().Be(2);
        dto.SmtpEnabled.Should().BeFalse();
    }

    [Fact]
    public async Task Resend_returns_not_found_when_missing()
    {
        _emails.ResendAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns<Task<EmailMessageDto>>(_ => throw new KeyNotFoundException());

        var result = await CreateSut().Resend(Guid.NewGuid(), CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task List_returns_recent_messages()
    {
        var id = Guid.NewGuid();
        _emails.ListRecentAsync(40, Arg.Any<CancellationToken>())
            .Returns([
                new EmailMessageDto
                {
                    Id = id,
                    ToAddress = "reader@spst.sk",
                    Subject = "Test",
                    Status = EmailDeliveryStatus.LoggedOnly,
                    CreatedAt = DateTimeOffset.UtcNow,
                },
            ]);

        var result = await CreateSut().List(40, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var list = ok.Value.Should().BeAssignableTo<IReadOnlyList<EmailMessageDto>>().Subject;
        list.Should().ContainSingle(m => m.Id == id);
    }
}

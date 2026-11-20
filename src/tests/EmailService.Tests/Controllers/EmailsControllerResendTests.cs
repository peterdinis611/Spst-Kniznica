using EmailService.Controllers;
using EmailService.DTOs;
using EmailService.Models;
using EmailService.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using SpstKniznica.Common.Auth;

namespace EmailService.Tests.Controllers;

public class EmailsControllerResendTests
{
    [Fact]
    public async Task Resend_returns_ok_and_audits_on_success()
    {
        var emails = Substitute.For<IEmailDispatchService>();
        var audit = Substitute.For<IAuditLogger>();
        var id = Guid.NewGuid();
        var sent = new EmailMessageDto
        {
            Id = Guid.NewGuid(),
            ToAddress = "a@spst.sk",
            Subject = "Hi",
            TemplateKey = "resend",
            Status = EmailDeliveryStatus.LoggedOnly,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        emails.ResendAsync(id, Arg.Any<CancellationToken>()).Returns(sent);
        var sut = new EmailsController(emails, audit);

        var result = await sut.Resend(id, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(sent);
        audit.Received(1).StaffAction(
            Arg.Any<System.Security.Claims.ClaimsPrincipal>(),
            "email.resend",
            "EmailMessage",
            sent.Id.ToString(),
            Arg.Any<object?>());
    }

    [Fact]
    public async Task LoanDueReminder_returns_bad_request_on_argument_error()
    {
        var emails = Substitute.For<IEmailDispatchService>();
        var audit = Substitute.For<IAuditLogger>();
        emails.SendLoanDueReminderAsync(Arg.Any<LoanEmailTemplateRequest>(), Arg.Any<CancellationToken>())
            .Returns<Task<EmailMessageDto>>(_ => throw new ArgumentException("bad email"));
        var sut = new EmailsController(emails, audit);

        var result = await sut.LoanDueReminder(
            new LoanEmailTemplateRequest
            {
                BookingId = Guid.NewGuid(),
                BookId = Guid.NewGuid(),
                BorrowerEmail = "x",
                DueDate = DateTimeOffset.UtcNow,
            },
            CancellationToken.None);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }
}

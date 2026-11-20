using System.Net;
using BookingService.Clients;
using BookingService.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using SpstKniznica.Common.Auth;
using MsOptions = Microsoft.Extensions.Options.Options;

namespace BookingService.Tests.Clients;

public class HttpLoanNotificationSenderTests
{
    [Fact]
    public async Task SendDueReminder_posts_loan_due_template()
    {
        HttpRequestMessage? captured = null;
        var handler = new CaptureHandler((req, _) =>
        {
            captured = req;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        });
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://email.test/") };
        var sut = new HttpLoanNotificationSender(
            http,
            MsOptions.Create(new InternalApiOptions { SharedKey = "secret" }),
            NullLogger<HttpLoanNotificationSender>.Instance);

        await sut.SendDueReminderAsync(new LoanNotificationMessage(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "reader@spst.sk",
            "Reader",
            DateTimeOffset.UtcNow.AddDays(2)));

        captured.Should().NotBeNull();
        captured!.Method.Should().Be(HttpMethod.Post);
        captured.RequestUri!.ToString().Should().Contain("loan-due-reminder");
        captured.Headers.GetValues(InternalApiOptions.HeaderName).Should().Contain("secret");
    }

    [Fact]
    public async Task SendWaitlistPromotion_swallows_http_failures()
    {
        var handler = new CaptureHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)));
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://email.test/") };
        var sut = new HttpLoanNotificationSender(
            http,
            MsOptions.Create(new InternalApiOptions { SharedKey = "secret" }),
            NullLogger<HttpLoanNotificationSender>.Instance);

        var act = async () => await sut.SendWaitlistPromotionAsync(new LoanNotificationMessage(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "reader@spst.sk",
            "Reader",
            DateTimeOffset.UtcNow.AddDays(1)));

        await act.Should().NotThrowAsync();
    }

    private sealed class CaptureHandler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => send(request, cancellationToken);
    }
}

using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Auth;

namespace SpstKniznica.Common.Tests.Auth;

public class HttpAdminAuditSinkTests
{
    [Fact]
    public async Task WriteAsync_skips_when_disabled()
    {
        var handler = new RecordingHandler(HttpStatusCode.OK);
        var sut = CreateSink(handler, enabled: false, baseUrl: "http://admin.test");

        await sut.WriteAsync(SampleEntry());

        handler.Calls.Should().BeEmpty();
    }

    [Fact]
    public async Task WriteAsync_skips_when_base_url_missing()
    {
        var handler = new RecordingHandler(HttpStatusCode.OK);
        var sut = CreateSink(handler, enabled: true, baseUrl: "  ");

        await sut.WriteAsync(SampleEntry());

        handler.Calls.Should().BeEmpty();
    }

    [Fact]
    public async Task WriteAsync_posts_json_with_internal_api_header()
    {
        var handler = new RecordingHandler(HttpStatusCode.NoContent);
        var sut = CreateSink(handler, enabled: true, baseUrl: "http://admin.test/", apiKey: "secret-key");

        await sut.WriteAsync(SampleEntry());

        handler.Calls.Should().ContainSingle();
        var call = handler.Calls[0];
        call.Method.Should().Be(HttpMethod.Post);
        call.Url.Should().Be("http://admin.test/api/internal/audit");
        call.ApiKey.Should().Be("secret-key");
        call.Body.Should().Contain("book.create");
    }

    [Fact]
    public async Task WriteAsync_throws_on_non_success_status_for_durable_outbox()
    {
        var handler = new RecordingHandler(HttpStatusCode.ServiceUnavailable);
        var sut = CreateSink(handler, enabled: true, baseUrl: "http://admin.test");

        var act = async () => await sut.WriteAsync(SampleEntry());

        await act.Should().ThrowAsync<HttpRequestException>();
        handler.Calls.Should().ContainSingle();
    }

    [Fact]
    public async Task WriteAsync_throws_when_transport_fails_for_durable_outbox()
    {
        var handler = new ThrowingHandler();
        var sut = CreateSink(handler, enabled: true, baseUrl: "http://admin.test");

        var act = async () => await sut.WriteAsync(SampleEntry());

        await act.Should().ThrowAsync<HttpRequestException>();
    }

    private static HttpAdminAuditSink CreateSink(
        HttpMessageHandler handler,
        bool enabled,
        string baseUrl,
        string? apiKey = "test-key")
    {
        var http = new HttpClient(handler);
        return new HttpAdminAuditSink(
            http,
            Options.Create(new AdminAuditOptions { Enabled = enabled, BaseUrl = baseUrl }),
            Options.Create(new InternalApiOptions { SharedKey = apiKey ?? string.Empty }),
            NullLogger<HttpAdminAuditSink>.Instance);
    }

    private static AuditEntry SampleEntry() => new()
    {
        Action = "book.create",
        EntityType = "Book",
        EntityId = Guid.NewGuid().ToString("N"),
        Roles = "Librarian",
    };

    private sealed record CapturedCall(HttpMethod Method, string Url, string? ApiKey, string Body);

    private sealed class RecordingHandler(HttpStatusCode status) : HttpMessageHandler
    {
        public List<CapturedCall> Calls { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var body = request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken);
            request.Headers.TryGetValues(InternalApiOptions.HeaderName, out var keys);
            Calls.Add(new CapturedCall(
                request.Method,
                request.RequestUri!.ToString(),
                keys?.FirstOrDefault(),
                body));
            return new HttpResponseMessage(status)
            {
                Content = new StringContent(string.Empty, Encoding.UTF8, "application/json"),
            };
        }
    }

    private sealed class ThrowingHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => throw new HttpRequestException("unreachable");
    }
}

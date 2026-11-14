using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SpstKniznica.Common.Integrations;

namespace SpstKniznica.Common.Tests.Integrations;

public class IsbnCatalogLookupTests
{
    [Fact]
    public async Task LookupAsync_prefers_open_library()
    {
        const string isbn = "9780131103627";
        var olJson =
            $$"""
            {
              "ISBN:{{isbn}}": {
                "title": "From Open Library",
                "authors": [{"name": "A"}],
                "publishers": [{"name": "P"}]
              }
            }
            """;

        var openLibrary = new OpenLibraryClient(
            new HttpClient(new FixedJsonHandler(olJson)),
            NullLogger<OpenLibraryClient>.Instance);
        var worldCat = new WorldCatClient(
            new HttpClient(new FixedJsonHandler("""{"items":[]}""")),
            Options.Create(new WorldCatOptions { Enabled = false }),
            NullLogger<WorldCatClient>.Instance);

        var sut = new IsbnCatalogLookup(openLibrary, worldCat);
        var result = await sut.LookupAsync(isbn);

        result.Should().NotBeNull();
        result!.Title.Should().Be("From Open Library");
        result.Source.Should().Be("OpenLibrary");
    }

    [Fact]
    public async Task LookupAsync_falls_back_to_worldcat_when_configured()
    {
        var openLibrary = new OpenLibraryClient(
            new HttpClient(new FixedJsonHandler("{}")),
            NullLogger<OpenLibraryClient>.Instance);
        var worldCat = new WorldCatClient(
            new HttpClient(new FixedJsonHandler(
                """{"bibs":[{"title":"From WorldCat","creator":"Author","publisher":"Pub","date":"2020"}]}""")),
            Options.Create(new WorldCatOptions { Enabled = true, WsKey = "test-key" }),
            NullLogger<WorldCatClient>.Instance);

        var sut = new IsbnCatalogLookup(openLibrary, worldCat);
        var result = await sut.LookupAsync("9780131103627");

        result.Should().NotBeNull();
        result!.Title.Should().Be("From WorldCat");
        result.Source.Should().Be("WorldCat");
    }

    private sealed class FixedJsonHandler(string json) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
    }
}

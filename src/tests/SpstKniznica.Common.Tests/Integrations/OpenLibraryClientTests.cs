using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using SpstKniznica.Common.Integrations;

namespace SpstKniznica.Common.Tests.Integrations;

public class OpenLibraryClientTests
{
    [Fact]
    public async Task LookupByIsbnAsync_maps_open_library_payload()
    {
        const string isbn = "9780131103627";
        var json =
            $$"""
            {
              "ISBN:{{isbn}}": {
                "title": "The C Programming Language",
                "subtitle": "2nd Edition",
                "authors": [{"name": "Brian W. Kernighan"}],
                "publishers": [{"name": "Prentice Hall"}],
                "publish_date": "1988",
                "number_of_pages": 272,
                "url": "https://openlibrary.org/books/OL123M"
              }
            }
            """;

        var client = new OpenLibraryClient(
            new HttpClient(new FixedJsonHandler(json)),
            NullLogger<OpenLibraryClient>.Instance);

        var result = await client.LookupByIsbnAsync("978-0-13-110362-7");

        result.Should().NotBeNull();
        result!.Title.Should().Be("The C Programming Language");
        result.Subtitle.Should().Be("2nd Edition");
        result.Authors.Should().Contain("Kernighan");
        result.Publisher.Should().Be("Prentice Hall");
        result.PublishedYear.Should().Be(1988);
        result.PageCount.Should().Be(272);
        result.CoverUrl.Should().Contain(isbn);
        result.Source.Should().Be("OpenLibrary");
    }

    [Fact]
    public async Task LookupByIsbnAsync_returns_null_when_missing()
    {
        var client = new OpenLibraryClient(
            new HttpClient(new FixedJsonHandler("{}")),
            NullLogger<OpenLibraryClient>.Instance);

        var result = await client.LookupByIsbnAsync("9780131103627");
        result.Should().BeNull();
    }

    [Fact]
    public async Task LookupByIsbnAsync_returns_null_for_invalid_isbn()
    {
        var client = new OpenLibraryClient(
            new HttpClient(new FixedJsonHandler("{}")),
            NullLogger<OpenLibraryClient>.Instance);

        (await client.LookupByIsbnAsync("abc")).Should().BeNull();
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

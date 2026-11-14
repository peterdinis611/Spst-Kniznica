using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using SpstKniznica.Common.Integrations;

namespace SpstKniznica.Common.Tests.Integrations;

public class WikidataClientTests
{
    [Fact]
    public async Task EnrichAuthorAsync_maps_search_and_claims()
    {
        var handler = new SequenceHandler(
        [
            // wbsearchentities
            """
            {
              "search": [
                {
                  "id": "Q42",
                  "label": "Douglas Adams",
                  "description": "English author"
                }
              ]
            }
            """,
            // EntityData
            """
            {
              "entities": {
                "Q42": {
                  "claims": {
                    "P214": [
                      {
                        "mainsnak": {
                          "datavalue": { "value": "113230702" }
                        }
                      }
                    ],
                    "P569": [
                      {
                        "mainsnak": {
                          "datavalue": {
                            "value": { "time": "+1952-03-11T00:00:00Z" }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
            """,
        ]);

        var client = new WikidataClient(new HttpClient(handler), NullLogger<WikidataClient>.Instance);
        var result = await client.EnrichAuthorAsync("Douglas Adams");

        result.Should().NotBeNull();
        result!.Name.Should().Be("Douglas Adams");
        result.Biography.Should().Be("English author");
        result.WikidataId.Should().Be("Q42");
        result.ViafId.Should().Be("113230702");
        result.BirthYear.Should().Be(1952);
        result.ProfileUrl.Should().Contain("viaf.org");
    }

    [Fact]
    public async Task EnrichAuthorAsync_returns_null_when_empty_query()
    {
        var client = new WikidataClient(
            new HttpClient(new SequenceHandler([])),
            NullLogger<WikidataClient>.Instance);
        (await client.EnrichAuthorAsync("  ")).Should().BeNull();
    }

    private sealed class SequenceHandler(IReadOnlyList<string> payloads) : HttpMessageHandler
    {
        private int _index;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var json = _index < payloads.Count ? payloads[_index++] : "{}";
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
        }
    }
}

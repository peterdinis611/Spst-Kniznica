namespace SpstKniznica.Common.Integrations;

public sealed class IsbnLookupResult
{
    public required string Isbn { get; init; }
    public string? Title { get; init; }
    public string? Subtitle { get; init; }
    public string? Authors { get; init; }
    public string? Publisher { get; init; }
    public int? PublishedYear { get; init; }
    public string? Language { get; init; }
    public int? PageCount { get; init; }
    public string? Description { get; init; }
    public string? CoverUrl { get; init; }
    public string Source { get; init; } = "OpenLibrary";
    public string? SourceUrl { get; init; }
}

public sealed class AuthorEnrichmentResult
{
    public required string Query { get; init; }
    public string? Name { get; init; }
    public string? Biography { get; init; }
    public string? Nationality { get; init; }
    public int? BirthYear { get; init; }
    public string? WikidataId { get; init; }
    public string? ViafId { get; init; }
    public string? ProfileUrl { get; init; }
    public string Source { get; init; } = "Wikidata";
}

public sealed class GeocodeResult
{
    public required string Query { get; init; }
    public string? DisplayName { get; init; }
    public double Lat { get; init; }
    public double Lon { get; init; }
    public string? OsmUrl { get; init; }
}

using System.Net;
using System.Net.Http.Json;
using AuthorService.Interfaces;

namespace AuthorService.Services;

public sealed class RelationBookCountLookup(
    HttpClient httpClient,
    ILogger<RelationBookCountLookup> logger) : IRelationBookCountLookup
{
    public async Task<int?> GetAuthorBookCountAsync(
        Guid authorId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await httpClient.GetAsync(
                $"api/relations/authors/{authorId}",
                cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return 0;
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Relation book count for author {AuthorId} returned {StatusCode}",
                    authorId,
                    (int)response.StatusCode);
                return null;
            }

            var dto = await response.Content.ReadFromJsonAsync<RelationAuthorDto>(cancellationToken);
            return dto?.BookCount;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(ex, "Failed to resolve book count for author {AuthorId}", authorId);
            return null;
        }
    }

    private sealed class RelationAuthorDto
    {
        public int BookCount { get; set; }
    }
}

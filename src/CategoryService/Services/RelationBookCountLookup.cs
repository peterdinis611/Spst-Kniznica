using System.Net;
using System.Net.Http.Json;
using CategoryService.Interfaces;

namespace CategoryService.Services;

public sealed class RelationBookCountLookup(
    HttpClient httpClient,
    ILogger<RelationBookCountLookup> logger) : IRelationBookCountLookup
{
    public async Task<int?> GetCategoryBookCountAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await httpClient.GetAsync(
                $"api/relations/categories/{categoryId}",
                cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return 0;
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Relation book count for category {CategoryId} returned {StatusCode}",
                    categoryId,
                    (int)response.StatusCode);
                return null;
            }

            var dto = await response.Content.ReadFromJsonAsync<RelationCategoryDto>(cancellationToken);
            return dto?.BookCount;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(ex, "Failed to resolve book count for category {CategoryId}", categoryId);
            return null;
        }
    }

    private sealed class RelationCategoryDto
    {
        public int BookCount { get; set; }
    }
}

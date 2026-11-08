using System.Net;
using System.Net.Http.Json;
using BookService.Interfaces;
using SpstKniznica.Caching;

namespace BookService.Services;

public sealed class AuthorLookupClient(
    HttpClient httpClient,
    IAppCache cache,
    ILogger<AuthorLookupClient> logger) : IAuthorLookup
{
    public async Task<AuthorLookupResult?> GetByIdAsync(Guid authorId, CancellationToken cancellationToken = default)
    {
        var cacheKey = CacheKeys.Author(authorId);
        var cached = await cache.GetAsync<AuthorCacheDto>(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return new AuthorLookupResult(cached.Id, cached.Name, cached.IsActive);
        }

        try
        {
            using var response = await httpClient.GetAsync($"api/authors/{authorId}", cancellationToken);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            var dto = await response.Content.ReadFromJsonAsync<AuthorCacheDto>(cancellationToken);
            if (dto is null)
            {
                return null;
            }

            await cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10), cancellationToken);
            return new AuthorLookupResult(dto.Id, dto.Name, dto.IsActive);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogError(ex, "Failed to resolve author {AuthorId} from AuthorService", authorId);
            throw;
        }
    }

    private sealed class AuthorCacheDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Biography { get; set; }
        public string? Nationality { get; set; }
        public int? BirthYear { get; set; }
        public bool IsActive { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }
}

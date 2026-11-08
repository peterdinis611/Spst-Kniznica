using System.Net;
using System.Net.Http.Json;
using BookService.Interfaces;
using SpstKniznica.Caching;

namespace BookService.Services;

public sealed class CategoryLookupClient(
    HttpClient httpClient,
    IAppCache cache,
    ILogger<CategoryLookupClient> logger) : ICategoryLookup
{
    public async Task<CategoryLookupResult?> GetByIdAsync(Guid categoryId, CancellationToken cancellationToken = default)
    {
        var cacheKey = CacheKeys.Category(categoryId);
        var cached = await cache.GetAsync<CategoryCacheDto>(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return new CategoryLookupResult(cached.Id, cached.Name, cached.IsActive);
        }

        try
        {
            using var response = await httpClient.GetAsync($"api/categories/{categoryId}", cancellationToken);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            var dto = await response.Content.ReadFromJsonAsync<CategoryCacheDto>(cancellationToken);
            if (dto is null)
            {
                return null;
            }

            // Same key/shape as CategoryService so all services share one Redis entry.
            await cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10), cancellationToken);
            return new CategoryLookupResult(dto.Id, dto.Name, dto.IsActive);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogError(ex, "Failed to resolve category {CategoryId} from CategoryService", categoryId);
            throw;
        }
    }

    private sealed class CategoryCacheDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Color { get; set; }
        public bool IsActive { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }
}

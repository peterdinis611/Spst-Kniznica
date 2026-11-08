using System.Net;
using System.Net.Http.Json;
using BookService.Interfaces;

namespace BookService.Services;

public sealed class CategoryLookupClient(HttpClient httpClient, ILogger<CategoryLookupClient> logger) : ICategoryLookup
{
    public async Task<CategoryLookupResult?> GetByIdAsync(Guid categoryId, CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await httpClient.GetAsync($"api/categories/{categoryId}", cancellationToken);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            var dto = await response.Content.ReadFromJsonAsync<CategoryApiDto>(cancellationToken);
            if (dto is null)
            {
                return null;
            }

            return new CategoryLookupResult(dto.Id, dto.Name, dto.IsActive);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            logger.LogError(ex, "Failed to resolve category {CategoryId} from CategoryService", categoryId);
            throw;
        }
    }

    private sealed class CategoryApiDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}

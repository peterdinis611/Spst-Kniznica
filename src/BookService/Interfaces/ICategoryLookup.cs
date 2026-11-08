namespace BookService.Interfaces;

public interface ICategoryLookup
{
    Task<CategoryLookupResult?> GetByIdAsync(Guid categoryId, CancellationToken cancellationToken = default);
}

public sealed record CategoryLookupResult(Guid Id, string Name, bool IsActive);

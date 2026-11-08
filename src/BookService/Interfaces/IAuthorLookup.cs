namespace BookService.Interfaces;

public interface IAuthorLookup
{
    Task<AuthorLookupResult?> GetByIdAsync(Guid authorId, CancellationToken cancellationToken = default);
}

public sealed record AuthorLookupResult(Guid Id, string Name, bool IsActive);

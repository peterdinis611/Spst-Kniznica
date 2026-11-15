namespace AuthorService.Interfaces;

public interface IRelationBookCountLookup
{
    Task<int?> GetAuthorBookCountAsync(Guid authorId, CancellationToken cancellationToken = default);
}

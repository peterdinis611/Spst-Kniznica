namespace AuthorService.Interfaces;

public interface IUnitOfWork : IAsyncDisposable
{
    IAuthorRepository Authors { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

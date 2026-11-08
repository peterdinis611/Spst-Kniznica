namespace BookService.Interfaces;

public interface IUnitOfWork : IAsyncDisposable
{
    IBookRepository Books { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

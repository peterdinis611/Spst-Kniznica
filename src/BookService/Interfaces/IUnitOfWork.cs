namespace BookService.Interfaces;

public interface IUnitOfWork : IAsyncDisposable
{
    IBookRepository Books { get; }
    ICategoryRepository Categories { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

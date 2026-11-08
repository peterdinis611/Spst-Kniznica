namespace CategoryService.Interfaces;

public interface IUnitOfWork : IAsyncDisposable
{
    ICategoryRepository Categories { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

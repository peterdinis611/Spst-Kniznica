using AuthorService.Data;
using AuthorService.Interfaces;

namespace AuthorService.Repositories;

public class UnitOfWork(AuthorDbContext db, IAuthorRepository authors) : IUnitOfWork
{
    public IAuthorRepository Authors { get; } = authors;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => db.SaveChangesAsync(cancellationToken);

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

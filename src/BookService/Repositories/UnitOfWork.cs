using BookService.Data;
using BookService.Interfaces;

namespace BookService.Repositories;

public class UnitOfWork(BookDbContext db, IBookRepository books) : IUnitOfWork
{
    public IBookRepository Books { get; } = books;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => db.SaveChangesAsync(cancellationToken);

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

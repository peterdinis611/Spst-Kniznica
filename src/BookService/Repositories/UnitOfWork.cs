using BookService.Data;
using BookService.Interfaces;

namespace BookService.Repositories;

public class UnitOfWork(
    BookDbContext db,
    IBookRepository books,
    ICategoryRepository categories) : IUnitOfWork
{
    public IBookRepository Books { get; } = books;
    public ICategoryRepository Categories { get; } = categories;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => db.SaveChangesAsync(cancellationToken);

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

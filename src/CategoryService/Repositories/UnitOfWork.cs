using CategoryService.Data;
using CategoryService.Interfaces;

namespace CategoryService.Repositories;

public class UnitOfWork(CategoryDbContext db, ICategoryRepository categories) : IUnitOfWork
{
    public ICategoryRepository Categories { get; } = categories;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => db.SaveChangesAsync(cancellationToken);

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

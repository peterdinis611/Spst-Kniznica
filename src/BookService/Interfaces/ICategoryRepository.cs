using BookService.DTOs;
using BookService.Models;

namespace BookService.Interfaces;

public interface ICategoryRepository
{
    Task<PagedResult<Category>> FindAsync(CategoryQueryFilter filter, CancellationToken cancellationToken = default);
    Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Category category, CancellationToken cancellationToken = default);
    void Update(Category category);
    void Remove(Category category);
    Task<bool> NameExistsAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

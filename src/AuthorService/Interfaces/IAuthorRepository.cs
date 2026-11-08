using AuthorService.DTOs;
using AuthorService.Models;
using SpstKniznica.Common.Pagination;

namespace AuthorService.Interfaces;

public interface IAuthorRepository
{
    Task<PagedResult<Author>> FindAsync(AuthorQueryFilter filter, CancellationToken cancellationToken = default);
    Task<Author?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Author?> GetTrackedByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Author author, CancellationToken cancellationToken = default);
    void Update(Author author);
    void Remove(Author author);
    Task<bool> NameExistsAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

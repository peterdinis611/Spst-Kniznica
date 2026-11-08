using BookService.DTOs;
using BookService.Models;

namespace BookService.Interfaces;

public interface IBookRepository
{
    Task<IReadOnlyList<Book>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Book>> FindAsync(BookQueryFilter filter, CancellationToken cancellationToken = default);
    Task<Book?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Book> AddAsync(Book book, CancellationToken cancellationToken = default);
    Task<Book?> UpdateAsync(Guid id, Book updated, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> IsbnExistsAsync(string isbn, Guid? excludeId = null, CancellationToken cancellationToken = default);
}

using BookService.DTOs;
using BookService.Models;

namespace BookService.Interfaces;

public interface IBookRepository
{
    Task<PagedResult<Book>> FindAsync(BookQueryFilter filter, CancellationToken cancellationToken = default);
    Task<Book?> GetByIdAsync(Guid id, bool includeCopies = false, CancellationToken cancellationToken = default);
    Task AddAsync(Book book, CancellationToken cancellationToken = default);
    void Update(Book book);
    void Remove(Book book);
    Task AddRangeAsync(IEnumerable<Book> books, CancellationToken cancellationToken = default);
    Task<bool> IsbnExistsAsync(string isbn, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> InventoryNumberExistsAsync(string inventoryNumber, CancellationToken cancellationToken = default);
    Task<bool> BarcodeExistsAsync(string barcode, CancellationToken cancellationToken = default);
}

using BookService.DTOs;
using BookService.Models;

namespace BookService.Interfaces;

public interface IBooksService
{
    Task<PagedResult<Book>> SearchAsync(BookQueryFilter filter, CancellationToken cancellationToken = default);
    Task<BookDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookDetailDto> CreateAsync(CreateBookRequest request, CancellationToken cancellationToken = default);
    Task<BookDetailDto> UpdateAsync(Guid id, UpdateBookRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BulkImportResult> ImportAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
}

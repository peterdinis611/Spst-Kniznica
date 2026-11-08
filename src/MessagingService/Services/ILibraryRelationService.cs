using MessagingService.DTOs;

namespace MessagingService.Services;

public interface ILibraryRelationService
{
    Task ApplyEventAsync(string eventType, string payload, CancellationToken cancellationToken = default);
    Task<CategoryRelationDto?> GetCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BookRelationDto>> GetBooksByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    Task<AuthorRelationDto?> GetAuthorAsync(Guid authorId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BookRelationDto>> GetBooksByAuthorAsync(Guid authorId, CancellationToken cancellationToken = default);
    Task<BookRelationDto?> GetBookAsync(Guid bookId, CancellationToken cancellationToken = default);
    Task<RelationSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default);
}

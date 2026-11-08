using AuthorService.DTOs;
using SpstKniznica.Common.Pagination;

namespace AuthorService.Interfaces;

public interface IAuthorService
{
    Task<PagedResult<AuthorDto>> SearchAsync(AuthorQueryFilter filter, CancellationToken cancellationToken = default);
    Task<AuthorDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AuthorDto> CreateAsync(CreateAuthorRequest request, CancellationToken cancellationToken = default);
    Task<AuthorDto> UpdateAsync(Guid id, UpdateAuthorRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

using AuthorService.DTOs;
using AuthorService.Exceptions;
using AuthorService.Interfaces;
using AuthorService.Models;
using FluentValidation;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;
using SpstKniznica.Common.Pagination;
using SpstKniznica.Common.Text;

namespace AuthorService.Services;

public class AuthorAppService(
    IUnitOfWork unitOfWork,
    IAppCache cache,
    IIntegrationEventPublisher eventPublisher,
    IValidator<CreateAuthorRequest> createValidator,
    IValidator<UpdateAuthorRequest> updateValidator,
    ILogger<AuthorAppService> logger) : IAuthorService
{
    public async Task<PagedResult<AuthorDto>> SearchAsync(
        AuthorQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug(
            "Searching authors. Page={Page}, PageSize={PageSize}, Search={Search}, IsActive={IsActive}",
            filter.Page,
            filter.PageSize,
            filter.Search,
            filter.IsActive);

        var result = await unitOfWork.Authors.FindAsync(filter, cancellationToken);
        return result.Map(Map);
    }

    public async Task<AuthorDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await cache.GetOrSetAsync(
            CacheKeys.Author(id),
            async ct =>
            {
                var author = await GetRequiredAsync(id, tracked: false, ct);
                return Map(author);
            },
            TimeSpan.FromMinutes(10),
            cancellationToken);
    }

    public async Task<AuthorDto> CreateAsync(
        CreateAuthorRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureValid(await createValidator.ValidateAsync(request, cancellationToken));

        var name = StringNormalize.Required(request.Name);
        await EnsureUniqueNameAsync(name, null, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var author = new Author
        {
            Id = Guid.NewGuid(),
            Name = name,
            Biography = StringNormalize.Optional(request.Biography),
            Nationality = StringNormalize.Optional(request.Nationality),
            BirthYear = request.BirthYear,
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };

        await unitOfWork.Authors.AddAsync(author, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await eventPublisher.PublishAsync(
            new AuthorCreatedEvent(author.Id, author.Name, author.Nationality, author.IsActive),
            cancellationToken);

        var dto = Map(author);
        await cache.SetAsync(CacheKeys.Author(author.Id), dto, TimeSpan.FromMinutes(10), cancellationToken);

        logger.LogInformation("Created author {AuthorId} named '{Name}'", author.Id, author.Name);
        return dto;
    }

    public async Task<AuthorDto> UpdateAsync(
        Guid id,
        UpdateAuthorRequest request,
        CancellationToken cancellationToken = default)
    {
        var context = new ValidationContext<UpdateAuthorRequest>(request);
        context.RootContextData["AuthorId"] = id;
        EnsureValid(await updateValidator.ValidateAsync(context, cancellationToken));

        var author = await GetRequiredAsync(id, tracked: true, cancellationToken);
        var name = StringNormalize.Required(request.Name);
        await EnsureUniqueNameAsync(name, id, cancellationToken);

        author.Name = name;
        author.Biography = StringNormalize.Optional(request.Biography);
        author.Nationality = StringNormalize.Optional(request.Nationality);
        author.BirthYear = request.BirthYear;
        author.IsActive = request.IsActive;
        author.UpdatedAt = DateTimeOffset.UtcNow;

        unitOfWork.Authors.Update(author);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await eventPublisher.PublishAsync(
            new AuthorUpdatedEvent(author.Id, author.Name, author.Nationality, author.IsActive),
            cancellationToken);

        var dto = Map(author);
        await cache.SetAsync(CacheKeys.Author(author.Id), dto, TimeSpan.FromMinutes(10), cancellationToken);

        logger.LogInformation("Updated author {AuthorId} named '{Name}'", author.Id, author.Name);
        return dto;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var author = await GetRequiredAsync(id, tracked: true, cancellationToken);
        unitOfWork.Authors.Remove(author);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await eventPublisher.PublishAsync(new AuthorDeletedEvent(id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.Author(id), cancellationToken);
        logger.LogInformation("Deleted author {AuthorId} named '{Name}'", id, author.Name);
    }

    private async Task<Author> GetRequiredAsync(Guid id, bool tracked, CancellationToken cancellationToken)
    {
        var author = tracked
            ? await unitOfWork.Authors.GetTrackedByIdAsync(id, cancellationToken)
            : await unitOfWork.Authors.GetByIdAsync(id, cancellationToken);

        if (author is null)
        {
            logger.LogWarning("Author {AuthorId} was not found", id);
            throw new NotFoundException($"Author '{id}' was not found.");
        }

        return author;
    }

    private async Task EnsureUniqueNameAsync(string name, Guid? excludeId, CancellationToken cancellationToken)
    {
        if (await unitOfWork.Authors.NameExistsAsync(name, excludeId, cancellationToken))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Name"] = ["An author with this name already exists."]
            });
        }
    }

    private static AuthorDto Map(Author author) => new()
    {
        Id = author.Id,
        Name = author.Name,
        Biography = author.Biography,
        Nationality = author.Nationality,
        BirthYear = author.BirthYear,
        IsActive = author.IsActive,
        CreatedAt = author.CreatedAt,
        UpdatedAt = author.UpdatedAt
    };

    private static void EnsureValid(FluentValidation.Results.ValidationResult validation)
    {
        if (!validation.IsValid)
        {
            throw new AppValidationException(validation.ToDictionary());
        }
    }
}

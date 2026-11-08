using MessagingService.Data;
using MessagingService.DTOs;
using MessagingService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Caching;
using SpstKniznica.Common.Messaging;

namespace MessagingService.Services;

public class LibraryRelationService(
    MessagingDbContext db,
    IAppCache cache,
    ILogger<LibraryRelationService> logger) : ILibraryRelationService
{
    public async Task ApplyEventAsync(string eventType, string payload, CancellationToken cancellationToken = default)
    {
        switch (eventType)
        {
            case nameof(CategoryCreatedEvent):
            case nameof(CategoryUpdatedEvent):
                await UpsertCategoryAsync(payload, cancellationToken);
                break;
            case nameof(CategoryDeletedEvent):
                await DeleteCategoryAsync(payload, cancellationToken);
                break;
            case nameof(AuthorCreatedEvent):
            case nameof(AuthorUpdatedEvent):
                await UpsertAuthorAsync(payload, cancellationToken);
                break;
            case nameof(AuthorDeletedEvent):
                await DeleteAuthorAsync(payload, cancellationToken);
                break;
            case nameof(BookCreatedEvent):
            case nameof(BookUpdatedEvent):
                await UpsertBookAsync(payload, cancellationToken);
                break;
            case nameof(BookDeletedEvent):
                await DeleteBookAsync(payload, cancellationToken);
                break;
            case nameof(PingEvent):
                logger.LogDebug("Ignoring ping event");
                break;
            default:
                logger.LogWarning("Unknown event type {EventType}", eventType);
                break;
        }
    }

    public Task<CategoryRelationDto?> GetCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default)
        => cache.GetOrSetAsync(
            CacheKeys.RelationCategory(categoryId),
            async ct => await db.Categories
                .AsNoTracking()
                .Where(c => c.Id == categoryId)
                .Select(c => new CategoryRelationDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    IsActive = c.IsActive,
                    BookCount = c.Books.Count
                })
                .FirstOrDefaultAsync(ct),
            TimeSpan.FromMinutes(2),
            cancellationToken);

    public async Task<IReadOnlyList<BookRelationDto>> GetBooksByCategoryAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default)
    {
        return await cache.GetOrSetAsync(
            CacheKeys.RelationCategoryBooks(categoryId),
            ct => QueryBooksAsync(b => b.CategoryId == categoryId, ct),
            TimeSpan.FromMinutes(2),
            cancellationToken);
    }

    public Task<AuthorRelationDto?> GetAuthorAsync(Guid authorId, CancellationToken cancellationToken = default)
        => cache.GetOrSetAsync(
            CacheKeys.RelationAuthor(authorId),
            async ct => await db.Authors
                .AsNoTracking()
                .Where(a => a.Id == authorId)
                .Select(a => new AuthorRelationDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Nationality = a.Nationality,
                    IsActive = a.IsActive,
                    BookCount = a.Books.Count
                })
                .FirstOrDefaultAsync(ct),
            TimeSpan.FromMinutes(2),
            cancellationToken);

    public async Task<IReadOnlyList<BookRelationDto>> GetBooksByAuthorAsync(
        Guid authorId,
        CancellationToken cancellationToken = default)
    {
        return await cache.GetOrSetAsync(
            CacheKeys.RelationAuthorBooks(authorId),
            ct => QueryBooksAsync(b => b.AuthorId == authorId, ct),
            TimeSpan.FromMinutes(2),
            cancellationToken);
    }

    public Task<BookRelationDto?> GetBookAsync(Guid bookId, CancellationToken cancellationToken = default)
        => cache.GetOrSetAsync(
            CacheKeys.RelationBook(bookId),
            async ct => await db.Books
                .AsNoTracking()
                .Where(b => b.Id == bookId)
                .Select(MapBookExpression())
                .FirstOrDefaultAsync(ct),
            TimeSpan.FromMinutes(2),
            cancellationToken);

    public Task<RelationSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
        => cache.GetOrSetAsync(
            CacheKeys.RelationSummary(),
            async ct =>
            {
                var categoryCount = await db.Categories.CountAsync(ct);
                var authorCount = await db.Authors.CountAsync(ct);
                var bookCount = await db.Books.CountAsync(ct);
                var linkedBookCount = await db.Books.CountAsync(
                    b => b.CategoryId != null || b.AuthorId != null,
                    ct);

                return new RelationSummaryDto
                {
                    CategoryCount = categoryCount,
                    AuthorCount = authorCount,
                    BookCount = bookCount,
                    LinkedBookCount = linkedBookCount,
                    UnlinkedBookCount = bookCount - linkedBookCount
                };
            },
            TimeSpan.FromMinutes(1),
            cancellationToken);

    private async Task<List<BookRelationDto>> QueryBooksAsync(
        System.Linq.Expressions.Expression<Func<BookProjection, bool>> predicate,
        CancellationToken cancellationToken)
    {
        return await db.Books
            .AsNoTracking()
            .Where(predicate)
            .OrderBy(b => b.Title)
            .Select(MapBookExpression())
            .ToListAsync(cancellationToken);
    }

    private static System.Linq.Expressions.Expression<Func<BookProjection, BookRelationDto>> MapBookExpression()
        => b => new BookRelationDto
        {
            Id = b.Id,
            Title = b.Title,
            AuthorId = b.AuthorId,
            Author = b.Author,
            Isbn = b.Isbn,
            CategoryId = b.CategoryId,
            CategoryName = b.CategoryName
        };

    private async Task UpsertCategoryAsync(string payload, CancellationToken cancellationToken)
    {
        var evt = EventJson.Deserialize<CategoryUpdatedEvent>(payload)
            ?? throw new InvalidOperationException("Invalid category event payload.");

        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == evt.CategoryId, cancellationToken);
        if (category is null)
        {
            category = new CategoryProjection
            {
                Id = evt.CategoryId,
                Name = evt.Name,
                Description = evt.Description,
                IsActive = evt.IsActive,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Categories.Add(category);
        }
        else
        {
            category.Name = evt.Name;
            category.Description = evt.Description;
            category.IsActive = evt.IsActive;
            category.UpdatedAt = DateTimeOffset.UtcNow;
        }

        var books = await db.Books.Where(b => b.CategoryId == evt.CategoryId).ToListAsync(cancellationToken);
        foreach (var book in books)
        {
            book.CategoryName = evt.Name;
            book.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        await InvalidateRelationCacheAsync(
            categoryId: evt.CategoryId,
            bookIds: books.Select(b => b.Id),
            cancellationToken: cancellationToken);
        logger.LogInformation("Projection upserted category {CategoryId} '{Name}'", evt.CategoryId, evt.Name);
    }

    private async Task DeleteCategoryAsync(string payload, CancellationToken cancellationToken)
    {
        var deleted = EventJson.Deserialize<CategoryDeletedEvent>(payload)
            ?? throw new InvalidOperationException("Invalid category deleted payload.");

        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == deleted.CategoryId, cancellationToken);
        if (category is null)
        {
            return;
        }

        var books = await db.Books.Where(b => b.CategoryId == deleted.CategoryId).ToListAsync(cancellationToken);
        foreach (var book in books)
        {
            book.CategoryId = null;
            book.CategoryName = null;
            book.UpdatedAt = DateTimeOffset.UtcNow;
        }

        db.Categories.Remove(category);
        await db.SaveChangesAsync(cancellationToken);
        await InvalidateRelationCacheAsync(
            categoryId: deleted.CategoryId,
            bookIds: books.Select(b => b.Id),
            cancellationToken: cancellationToken);
        logger.LogInformation(
            "Projection deleted category {CategoryId} and unlinked {BookCount} books",
            deleted.CategoryId,
            books.Count);
    }

    private async Task UpsertAuthorAsync(string payload, CancellationToken cancellationToken)
    {
        var evt = EventJson.Deserialize<AuthorUpdatedEvent>(payload)
            ?? throw new InvalidOperationException("Invalid author event payload.");

        var author = await db.Authors.FirstOrDefaultAsync(a => a.Id == evt.AuthorId, cancellationToken);
        if (author is null)
        {
            author = new AuthorProjection
            {
                Id = evt.AuthorId,
                Name = evt.Name,
                Nationality = evt.Nationality,
                IsActive = evt.IsActive,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Authors.Add(author);
        }
        else
        {
            author.Name = evt.Name;
            author.Nationality = evt.Nationality;
            author.IsActive = evt.IsActive;
            author.UpdatedAt = DateTimeOffset.UtcNow;
        }

        var books = await db.Books.Where(b => b.AuthorId == evt.AuthorId).ToListAsync(cancellationToken);
        foreach (var book in books)
        {
            book.Author = evt.Name;
            book.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        await InvalidateRelationCacheAsync(
            authorId: evt.AuthorId,
            bookIds: books.Select(b => b.Id),
            cancellationToken: cancellationToken);
        logger.LogInformation("Projection upserted author {AuthorId} '{Name}'", evt.AuthorId, evt.Name);
    }

    private async Task DeleteAuthorAsync(string payload, CancellationToken cancellationToken)
    {
        var deleted = EventJson.Deserialize<AuthorDeletedEvent>(payload)
            ?? throw new InvalidOperationException("Invalid author deleted payload.");

        var author = await db.Authors.FirstOrDefaultAsync(a => a.Id == deleted.AuthorId, cancellationToken);
        if (author is null)
        {
            return;
        }

        var books = await db.Books.Where(b => b.AuthorId == deleted.AuthorId).ToListAsync(cancellationToken);
        foreach (var book in books)
        {
            book.AuthorId = null;
            book.Author = "Unknown";
            book.UpdatedAt = DateTimeOffset.UtcNow;
        }

        db.Authors.Remove(author);
        await db.SaveChangesAsync(cancellationToken);
        await InvalidateRelationCacheAsync(
            authorId: deleted.AuthorId,
            bookIds: books.Select(b => b.Id),
            cancellationToken: cancellationToken);
        logger.LogInformation(
            "Projection deleted author {AuthorId} and unlinked {BookCount} books",
            deleted.AuthorId,
            books.Count);
    }

    private async Task UpsertBookAsync(string payload, CancellationToken cancellationToken)
    {
        var evt = EventJson.Deserialize<BookUpdatedEvent>(payload)
            ?? throw new InvalidOperationException("Invalid book event payload.");

        if (evt.CategoryId.HasValue)
        {
            var categoryExists = await db.Categories.AnyAsync(c => c.Id == evt.CategoryId.Value, cancellationToken);
            if (!categoryExists)
            {
                db.Categories.Add(new CategoryProjection
                {
                    Id = evt.CategoryId.Value,
                    Name = string.IsNullOrWhiteSpace(evt.CategoryName) ? "Unknown" : evt.CategoryName,
                    IsActive = true,
                    UpdatedAt = DateTimeOffset.UtcNow
                });
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        if (evt.AuthorId.HasValue)
        {
            var authorExists = await db.Authors.AnyAsync(a => a.Id == evt.AuthorId.Value, cancellationToken);
            if (!authorExists)
            {
                db.Authors.Add(new AuthorProjection
                {
                    Id = evt.AuthorId.Value,
                    Name = string.IsNullOrWhiteSpace(evt.Author) ? "Unknown" : evt.Author,
                    IsActive = true,
                    UpdatedAt = DateTimeOffset.UtcNow
                });
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == evt.BookId, cancellationToken);
        var previousCategoryId = book?.CategoryId;
        var previousAuthorId = book?.AuthorId;
        if (book is null)
        {
            book = new BookProjection
            {
                Id = evt.BookId,
                Title = evt.Title,
                AuthorId = evt.AuthorId,
                Author = evt.Author,
                Isbn = evt.Isbn,
                CategoryId = evt.CategoryId,
                CategoryName = evt.CategoryName,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Books.Add(book);
        }
        else
        {
            book.Title = evt.Title;
            book.AuthorId = evt.AuthorId;
            book.Author = evt.Author;
            book.Isbn = evt.Isbn;
            book.CategoryId = evt.CategoryId;
            book.CategoryName = evt.CategoryName;
            book.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);

        var categoryIds = new List<Guid>();
        if (evt.CategoryId.HasValue)
        {
            categoryIds.Add(evt.CategoryId.Value);
        }

        if (previousCategoryId.HasValue && previousCategoryId != evt.CategoryId)
        {
            categoryIds.Add(previousCategoryId.Value);
        }

        var authorIds = new List<Guid>();
        if (evt.AuthorId.HasValue)
        {
            authorIds.Add(evt.AuthorId.Value);
        }

        if (previousAuthorId.HasValue && previousAuthorId != evt.AuthorId)
        {
            authorIds.Add(previousAuthorId.Value);
        }

        await InvalidateRelationCacheAsync(
            categoryIds: categoryIds,
            authorIds: authorIds,
            bookIds: [evt.BookId],
            cancellationToken: cancellationToken);
        logger.LogInformation(
            "Projection upserted book {BookId} -> author {AuthorId}, category {CategoryId}",
            evt.BookId,
            evt.AuthorId,
            evt.CategoryId);
    }

    private async Task DeleteBookAsync(string payload, CancellationToken cancellationToken)
    {
        var deleted = EventJson.Deserialize<BookDeletedEvent>(payload)
            ?? throw new InvalidOperationException("Invalid book deleted payload.");

        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == deleted.BookId, cancellationToken);
        if (book is null)
        {
            return;
        }

        var categoryId = book.CategoryId;
        var authorId = book.AuthorId;
        db.Books.Remove(book);
        await db.SaveChangesAsync(cancellationToken);
        await InvalidateRelationCacheAsync(
            categoryId: categoryId,
            authorId: authorId,
            bookIds: [deleted.BookId],
            cancellationToken: cancellationToken);
        logger.LogInformation("Projection deleted book {BookId}", deleted.BookId);
    }

    private async Task InvalidateRelationCacheAsync(
        Guid? categoryId = null,
        IEnumerable<Guid>? categoryIds = null,
        Guid? authorId = null,
        IEnumerable<Guid>? authorIds = null,
        IEnumerable<Guid>? bookIds = null,
        CancellationToken cancellationToken = default)
    {
        var categories = new HashSet<Guid>();
        if (categoryId.HasValue)
        {
            categories.Add(categoryId.Value);
        }

        if (categoryIds is not null)
        {
            foreach (var id in categoryIds)
            {
                categories.Add(id);
            }
        }

        foreach (var id in categories)
        {
            await cache.RemoveAsync(CacheKeys.RelationCategory(id), cancellationToken);
            await cache.RemoveAsync(CacheKeys.RelationCategoryBooks(id), cancellationToken);
        }

        var authors = new HashSet<Guid>();
        if (authorId.HasValue)
        {
            authors.Add(authorId.Value);
        }

        if (authorIds is not null)
        {
            foreach (var id in authorIds)
            {
                authors.Add(id);
            }
        }

        foreach (var id in authors)
        {
            await cache.RemoveAsync(CacheKeys.RelationAuthor(id), cancellationToken);
            await cache.RemoveAsync(CacheKeys.RelationAuthorBooks(id), cancellationToken);
        }

        if (bookIds is not null)
        {
            foreach (var bookId in bookIds)
            {
                await cache.RemoveAsync(CacheKeys.RelationBook(bookId), cancellationToken);
            }
        }

        await cache.RemoveAsync(CacheKeys.RelationSummary(), cancellationToken);
    }
}

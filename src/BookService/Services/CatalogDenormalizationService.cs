using BookService.Data;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Messaging;

namespace BookService.Services;

public sealed class CatalogDenormalizationService(
    BookDbContext db,
    ILogger<CatalogDenormalizationService> logger)
{
    public Task ApplyCategoryUpdatedAsync(
        Guid categoryId,
        string name,
        CancellationToken cancellationToken = default)
        => ApplyCategoryAsync(categoryId, name, deleted: false, cancellationToken);

    public Task ApplyCategoryDeletedAsync(
        Guid categoryId,
        CancellationToken cancellationToken = default)
        => ApplyCategoryAsync(categoryId, name: null, deleted: true, cancellationToken);

    public Task ApplyAuthorUpdatedAsync(
        Guid authorId,
        string name,
        CancellationToken cancellationToken = default)
        => ApplyAuthorAsync(authorId, name, deleted: false, cancellationToken);

    public Task ApplyAuthorDeletedAsync(
        Guid authorId,
        CancellationToken cancellationToken = default)
        => ApplyAuthorAsync(authorId, name: null, deleted: true, cancellationToken);

    public async Task ApplyEventPayloadAsync(
        string eventType,
        string payload,
        CancellationToken cancellationToken = default)
    {
        switch (eventType)
        {
            case nameof(CategoryUpdatedEvent):
            {
                var updated = EventJson.Deserialize<CategoryUpdatedEvent>(payload);
                if (updated is not null)
                {
                    await ApplyCategoryUpdatedAsync(updated.CategoryId, updated.Name, cancellationToken);
                }

                return;
            }
            case nameof(CategoryDeletedEvent):
            {
                var deleted = EventJson.Deserialize<CategoryDeletedEvent>(payload);
                if (deleted is not null)
                {
                    await ApplyCategoryDeletedAsync(deleted.CategoryId, cancellationToken);
                }

                return;
            }
            case nameof(AuthorUpdatedEvent):
            {
                var updated = EventJson.Deserialize<AuthorUpdatedEvent>(payload);
                if (updated is not null)
                {
                    await ApplyAuthorUpdatedAsync(updated.AuthorId, updated.Name, cancellationToken);
                }

                return;
            }
            case nameof(AuthorDeletedEvent):
            {
                var deleted = EventJson.Deserialize<AuthorDeletedEvent>(payload);
                if (deleted is not null)
                {
                    await ApplyAuthorDeletedAsync(deleted.AuthorId, cancellationToken);
                }

                return;
            }
        }
    }

    private async Task ApplyCategoryAsync(
        Guid categoryId,
        string? name,
        bool deleted,
        CancellationToken cancellationToken)
    {
        var books = await db.Books
            .Where(b => b.CategoryId == categoryId)
            .ToListAsync(cancellationToken);

        foreach (var book in books)
        {
            if (deleted)
            {
                book.CategoryId = null;
                book.CategoryName = null;
            }
            else
            {
                book.CategoryName = name;
            }

            book.UpdatedAt = DateTimeOffset.UtcNow;
        }

        if (books.Count == 0)
        {
            return;
        }

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            deleted
                ? "Cleared deleted category {CategoryId} from {Count} books"
                : "Synced category name '{Name}' to {Count} books",
            deleted ? categoryId : name,
            books.Count);
    }

    private async Task ApplyAuthorAsync(
        Guid authorId,
        string? name,
        bool deleted,
        CancellationToken cancellationToken)
    {
        var books = await db.Books
            .Where(b => b.AuthorId == authorId)
            .ToListAsync(cancellationToken);

        foreach (var book in books)
        {
            if (deleted)
            {
                book.AuthorId = null;
                book.Author = "Unknown";
            }
            else
            {
                book.Author = name ?? book.Author;
            }

            book.UpdatedAt = DateTimeOffset.UtcNow;
        }

        if (books.Count == 0)
        {
            return;
        }

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            deleted
                ? "Cleared deleted author {AuthorId} from {Count} books"
                : "Synced author name '{Name}' to {Count} books",
            deleted ? authorId : name,
            books.Count);
    }
}

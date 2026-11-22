using System.Globalization;
using System.Text;
using System.Xml.Linq;
using BookService.DTOs;
using BookService.Exceptions;
using BookService.Interfaces;
using BookService.Models;
using BookService.Validators;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Caching;
using SpstKniznica.Common.Integrations;
using SpstKniznica.Common.Messaging;
using SpstKniznica.Common.Pagination;

namespace BookService.Services;

public partial class BooksService(
    IUnitOfWork unitOfWork,
    IAuthorLookup authorLookup,
    ICategoryLookup categoryLookup,
    IAppCache cache,
    IIntegrationEventPublisher eventPublisher,
    IValidator<CreateBookRequest> createValidator,
    IValidator<UpdateBookRequest> updateValidator,
    IValidator<UpdateBookCopyStatusRequest> copyStatusValidator,
    ILogger<BooksService> logger) : IBooksService
{
    public Task<PagedResult<BookListItemDto>> SearchAsync(
        BookQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);
        return cache.GetOrSetAsync(
            BookListCacheKey.Page(filter),
            async ct =>
            {
                logger.LogDebug(
                    "Searching books. Page={Page}, PageSize={PageSize}, Search={Search}, CategoryId={CategoryId}",
                    filter.Page,
                    filter.PageSize,
                    filter.Search,
                    filter.CategoryId);

                var result = await unitOfWork.Books.FindAsync(filter, ct);

                logger.LogDebug(
                    "Books search finished. TotalCount={TotalCount}, PageItems={PageItems}",
                    result.TotalCount,
                    result.Items.Count);

                return result;
            },
            BookListCacheKey.Ttl,
            cancellationToken);
    }

    public Task<CursorPage<BookListItemDto>> SearchByCursorAsync(
        BookCursorFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);
        return cache.GetOrSetAsync(
            BookListCacheKey.Cursor(filter),
            async ct =>
            {
                logger.LogDebug(
                    "Cursor-searching books. Limit={Limit}, Cursor={Cursor}, Search={Search}",
                    filter.Limit,
                    filter.Cursor,
                    filter.Search);

                var result = await unitOfWork.Books.FindByCursorAsync(filter, ct);

                logger.LogDebug(
                    "Books cursor search finished. Items={Count}, HasMore={HasMore}",
                    result.Items.Count,
                    result.HasMore);

                return result;
            },
            BookListCacheKey.Ttl,
            cancellationToken);
    }

    public async Task<BookDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await cache.GetOrSetAsync(
            CacheKeys.Book(id),
            async ct =>
            {
                var book = await unitOfWork.Books.GetByIdAsync(id, includeCopies: true, ct);
                if (book is null)
                {
                    logger.LogWarning("Book {BookId} was not found", id);
                    throw new NotFoundException($"Book '{id}' was not found.");
                }

                logger.LogDebug("Loaded book {BookId} with {CopyCount} copies", book.Id, book.Copies.Count);
                return MapDetail(book);
            },
            TimeSpan.FromMinutes(5),
            cancellationToken);
    }

    public async Task<IReadOnlyList<BookCatalogSnapshot>> GetSummariesAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken = default)
    {
        if (ids.Count == 0)
        {
            return [];
        }

        var ordered = new BookCatalogSnapshot?[ids.Count];
        var missing = new List<Guid>();
        var missingAt = new List<int>();

        for (var i = 0; i < ids.Count; i++)
        {
            var id = ids[i];
            if (id == Guid.Empty)
            {
                continue;
            }

            var cached = await cache.GetAsync<BookCatalogSnapshot>(
                BookListCacheKey.Summary(id),
                cancellationToken);
            if (cached is not null)
            {
                ordered[i] = cached;
                continue;
            }

            missing.Add(id);
            missingAt.Add(i);
        }

        if (missing.Count == 0)
        {
            return Materialize(ordered);
        }

        var books = await unitOfWork.Books.GetByIdsAsync(missing, includeCopies: false, cancellationToken);
        var byId = new Dictionary<Guid, Book>();
        foreach (var book in books)
        {
            byId[book.Id] = book;
        }
        for (var j = 0; j < missing.Count; j++)
        {
            if (!byId.TryGetValue(missing[j], out var book))
            {
                continue;
            }

            var snapshot = new BookCatalogSnapshot
            {
                BookId = book.Id,
                Title = book.Title,
                Author = book.Author,
                TotalCopies = book.TotalCopies,
                AvailableCopies = book.AvailableCopies,
            };
            await cache.SetAsync(
                BookListCacheKey.Summary(book.Id),
                snapshot,
                BookListCacheKey.Ttl,
                cancellationToken);
            ordered[missingAt[j]] = snapshot;
        }

        return Materialize(ordered);
    }

    private static IReadOnlyList<BookCatalogSnapshot> Materialize(BookCatalogSnapshot?[] ordered)
    {
        var items = new List<BookCatalogSnapshot>(ordered.Length);
        foreach (var snapshot in ordered)
        {
            if (snapshot is not null)
            {
                items.Add(snapshot);
            }
        }

        return items;
    }

    public async Task<IReadOnlyList<BookListItemDto>> GetByIdsAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken = default)
    {
        var books = await unitOfWork.Books.GetByIdsAsync(ids, includeCopies: false, cancellationToken);
        return books
            .Select(b => new BookListItemDto
            {
                Id = b.Id,
                Title = b.Title,
                Subtitle = b.Subtitle,
                AuthorId = b.AuthorId,
                Author = b.Author,
                Publisher = b.Publisher,
                Isbn = b.Isbn,
                PublishedYear = b.PublishedYear,
                Language = b.Language,
                CategoryId = b.CategoryId,
                CategoryName = b.CategoryName,
                Format = b.Format,
                CoverUrl = b.CoverUrl ?? OpenLibraryCovers.ForIsbn(b.Isbn),
                ShelfLocation = b.ShelfLocation,
                TotalCopies = b.TotalCopies,
                AvailableCopies = b.AvailableCopies,
                UpdatedAt = b.UpdatedAt,
            })
            .ToList();
    }

    private async Task SaveChangesOrConflictAsync(CancellationToken cancellationToken)
    {
        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            logger.LogWarning(ex, "Book save lost a concurrency race");
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Conflict"] =
                [
                    "Záznam medzitým zmenil niekto iný. Obnovte stránku a skúste znova."
                ]
            });
        }
    }

    private Task InvalidateBookCachesAsync(Guid bookId, CancellationToken cancellationToken) =>
        Task.WhenAll(
            cache.RemoveAsync(CacheKeys.Book(bookId), cancellationToken),
            cache.RemoveByPrefixAsync(CacheKeys.BookListPrefix, cancellationToken));

    public async Task<BookCopyLookupDto> LookupCopyByCodeAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["code"] = ["Kód výtlačku je povinný."]
            });
        }

        var copy = await unitOfWork.Books.FindCopyByCodeAsync(code, cancellationToken);
        if (copy is null)
        {
            logger.LogInformation("Book copy lookup missed for code {Code}", code.Trim());
            throw new NotFoundException($"Book copy with code '{code.Trim()}' was not found.");
        }

        var book = copy.Book
            ?? await unitOfWork.Books.GetByIdAsync(copy.BookId, includeCopies: false, cancellationToken);

        if (book is null)
        {
            throw new NotFoundException($"Book copy with code '{code.Trim()}' was not found.");
        }

        return new BookCopyLookupDto
        {
            CopyId = copy.Id,
            BookId = copy.BookId,
            InventoryNumber = copy.InventoryNumber,
            Barcode = copy.Barcode,
            Status = copy.Status,
            BookTitle = book.Title,
            BookAuthor = book.Author,
        };
    }

    public async Task<UpdateBookCopyStatusResult> UpdateCopyStatusAsync(
        Guid bookId,
        Guid copyId,
        UpdateBookCopyStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await copyStatusValidator.ValidateAsync(request, cancellationToken);
        EnsureValid(validation);
        var nextStatus = request.Status!.Value;

        var book = await unitOfWork.Books.GetByIdAsync(bookId, includeCopies: true, cancellationToken);
        if (book is null)
        {
            logger.LogWarning(
                "Update copy status failed. Book {BookId} was not found",
                bookId);
            throw new NotFoundException($"Book '{bookId}' was not found.");
        }

        var copy = book.Copies.FirstOrDefault(c => c.Id == copyId);
        if (copy is null)
        {
            logger.LogWarning(
                "Update copy status failed. Copy {CopyId} on book {BookId} was not found",
                copyId,
                bookId);
            throw new NotFoundException($"Book copy '{copyId}' was not found on book '{bookId}'.");
        }

        if (copy.Status is BookCopyStatus.Borrowed or BookCopyStatus.Reserved)
        {
            logger.LogWarning(
                "Update copy status blocked. Copy {CopyId} is {CopyStatus} and only a loan can change it",
                copy.Id,
                copy.Status);
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["status"] =
                [
                    "Požičaný alebo rezervovaný výtlačok sa nedá prepísať. Najprv ho vráťte alebo zrušte rezerváciu."
                ]
            });
        }

        var utcNow = DateTimeOffset.UtcNow;
        if (copy.Status != nextStatus)
        {
            // Attach first, then bump Version. Update() copies the current token into
            // the original value used in WHERE, so the increment must happen after attach.
            unitOfWork.Books.Update(book);
            copy.Status = nextStatus;
            copy.Version++;
            copy.UpdatedAt = utcNow;
            book.RecalculateCopyCounts();
            book.UpdatedAt = utcNow;
            await SaveChangesOrConflictAsync(cancellationToken);

            var detail = MapDetail(book);
            await cache.SetAsync(
                CacheKeys.Book(book.Id),
                detail,
                TimeSpan.FromMinutes(5),
                cancellationToken);
            await cache.RemoveByPrefixAsync(CacheKeys.BookListPrefix, cancellationToken);

            logger.LogInformation(
                "Updated copy {CopyId} on book {BookId} → {CopyStatus}. AvailableCopies={AvailableCopies}",
                copy.Id,
                bookId,
                nextStatus,
                book.AvailableCopies);
        }

        return new UpdateBookCopyStatusResult
        {
            Copy = new BookCopyDto
            {
                Id = copy.Id,
                InventoryNumber = copy.InventoryNumber,
                Barcode = copy.Barcode,
                Status = copy.Status,
                ShelfLocation = copy.ShelfLocation,
            },
            TotalCopies = book.TotalCopies,
            AvailableCopies = book.AvailableCopies,
        };
    }

    public async Task<BookDetailDto> CreateAsync(CreateBookRequest request, CancellationToken cancellationToken = default)
    {
        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            logger.LogWarning(
                "Create book validation failed for '{Title}'. Errors={ErrorCount}",
                request.Title,
                validation.Errors.Count);
        }

        EnsureValid(validation);

        var book = request.ToBook();
        await ApplyAuthorAsync(book, request.AuthorId, cancellationToken);
        await ApplyCategoryAsync(book, request.CategoryId, cancellationToken);
        EnsureCopyCountConsistency(book);
        await EnsureUniqueIsbnAsync(book.Isbn, null, cancellationToken);

        CreateCopies(book, request.TotalCopies);
        book.RecalculateCopyCounts();

        await unitOfWork.Books.AddAsync(book, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await eventPublisher.PublishAsync(
            new BookCreatedEvent(
                book.Id,
                book.Title,
                book.AuthorId,
                book.Author,
                book.Isbn,
                book.CategoryId,
                book.CategoryName),
            cancellationToken);

        var detail = MapDetail(book);
        await cache.SetAsync(CacheKeys.Book(book.Id), detail, TimeSpan.FromMinutes(5), cancellationToken);
        await cache.RemoveByPrefixAsync(CacheKeys.BookListPrefix, cancellationToken);

        logger.LogInformation(
            "Created book {BookId} titled '{Title}' with {CopyCount} copies and ISBN {Isbn}",
            book.Id,
            book.Title,
            book.TotalCopies,
            book.Isbn);
        return detail;
    }

    public async Task<BookDetailDto> UpdateAsync(
        Guid id,
        UpdateBookRequest request,
        CancellationToken cancellationToken = default)
    {
        var context = new ValidationContext<UpdateBookRequest>(request);
        context.RootContextData["BookId"] = id;
        var validation = await updateValidator.ValidateAsync(context, cancellationToken);
        EnsureValid(validation);

        var book = await unitOfWork.Books.GetByIdAsync(id, includeCopies: true, cancellationToken);
        if (book is null)
        {
            throw new NotFoundException($"Book '{id}' was not found.");
        }

        var updated = request.ToBook(id, book.CreatedAt);
        await EnsureUniqueIsbnAsync(updated.Isbn, id, cancellationToken);

        book.Title = updated.Title;
        book.Subtitle = updated.Subtitle;
        book.Publisher = updated.Publisher;
        book.Isbn = updated.Isbn;
        book.PublishedYear = updated.PublishedYear;
        book.Language = updated.Language;
        book.Description = updated.Description;
        book.CoverUrl = updated.CoverUrl;
        book.PageCount = updated.PageCount;
        book.Format = updated.Format;
        book.ShelfLocation = updated.ShelfLocation;
        book.UpdatedAt = DateTimeOffset.UtcNow;
        await ApplyAuthorAsync(book, request.AuthorId, cancellationToken);
        await ApplyCategoryAsync(book, request.CategoryId, cancellationToken);

        AdjustCopyCount(book, request.TotalCopies);
        book.RecalculateCopyCounts();

        unitOfWork.Books.Update(book);
        await SaveChangesOrConflictAsync(cancellationToken);

        await eventPublisher.PublishAsync(
            new BookUpdatedEvent(
                book.Id,
                book.Title,
                book.AuthorId,
                book.Author,
                book.Isbn,
                book.CategoryId,
                book.CategoryName),
            cancellationToken);

        var detail = MapDetail(book);
        await cache.SetAsync(CacheKeys.Book(book.Id), detail, TimeSpan.FromMinutes(5), cancellationToken);
        await cache.RemoveByPrefixAsync(CacheKeys.BookListPrefix, cancellationToken);

        logger.LogInformation(
            "Updated book {BookId}. Title='{Title}', TotalCopies={TotalCopies}, AvailableCopies={AvailableCopies}",
            book.Id,
            book.Title,
            book.TotalCopies,
            book.AvailableCopies);
        return detail;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await unitOfWork.Books.GetByIdAsync(id, includeCopies: true, cancellationToken);
        if (book is null)
        {
            logger.LogWarning("Delete failed. Book {BookId} was not found", id);
            throw new NotFoundException($"Book '{id}' was not found.");
        }

        if (book.Copies.Any(c => c.Status is BookCopyStatus.Borrowed or BookCopyStatus.Reserved))
        {
            logger.LogWarning(
                "Delete blocked for book {BookId} because some copies are borrowed or reserved",
                id);
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Copies"] = ["Cannot delete a book while copies are borrowed or reserved."]
            });
        }

        unitOfWork.Books.Remove(book);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await eventPublisher.PublishAsync(new BookDeletedEvent(id), cancellationToken);
        await InvalidateBookCachesAsync(id, cancellationToken);
        logger.LogInformation("Deleted book {BookId} titled '{Title}'", id, book.Title);
    }
}

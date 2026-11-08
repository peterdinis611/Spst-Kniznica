using System.Linq.Expressions;
using BookService.Data;
using BookService.DTOs;
using BookService.Exceptions;
using BookService.Interfaces;
using BookService.Models;
using Microsoft.EntityFrameworkCore;
using SpstKniznica.Common.Pagination;

namespace BookService.Repositories;

public class BookRepository(BookDbContext db) : IBookRepository
{
    private static readonly IReadOnlyDictionary<string, Expression<Func<Book, object>>> SortMap =
        new Dictionary<string, Expression<Func<Book, object>>>(StringComparer.OrdinalIgnoreCase)
        {
            ["title"] = b => b.Title,
            ["author"] = b => b.Author,
            ["publisher"] = b => b.Publisher ?? string.Empty,
            ["publishedyear"] = b => b.PublishedYear ?? 0,
            ["year"] = b => b.PublishedYear ?? 0,
            ["category"] = b => b.Category ?? string.Empty,
            ["createdat"] = b => b.CreatedAt,
            ["updatedat"] = b => b.UpdatedAt,
            ["totalcopies"] = b => b.TotalCopies,
            ["availablecopies"] = b => b.AvailableCopies,
            ["isbn"] = b => b.Isbn ?? string.Empty
        };

    public async Task<PagedResult<BookListItemDto>> FindAsync(
        BookQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);
        ValidateFilter(filter);
        filter.Normalize();

        var query = ApplyFilters(db.Books.AsNoTracking(), filter)
            .OrderByProperty(filter.SortBy, filter.IsDescending, SortMap, b => b.Title);

        var projected = query.Select(b => new BookListItemDto
        {
            Id = b.Id,
            Title = b.Title,
            Subtitle = b.Subtitle,
            Author = b.Author,
            Publisher = b.Publisher,
            Isbn = b.Isbn,
            PublishedYear = b.PublishedYear,
            Language = b.Language,
            Category = b.Category,
            Format = b.Format,
            ShelfLocation = b.ShelfLocation,
            TotalCopies = b.TotalCopies,
            AvailableCopies = b.AvailableCopies
        });

        return await projected.ToPagedResultAsync(filter, cancellationToken);
    }

    public Task<Book?> GetByIdAsync(Guid id, bool includeCopies = false, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);

        IQueryable<Book> query = includeCopies
            ? db.Books.Include(b => b.Copies).AsSplitQuery()
            : db.Books.AsNoTracking();

        return query.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public Task AddAsync(Book book, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(book);
        return db.Books.AddAsync(book, cancellationToken).AsTask();
    }

    public void Update(Book book)
    {
        ArgumentNullException.ThrowIfNull(book);
        db.Books.Update(book);
    }

    public void Remove(Book book)
    {
        ArgumentNullException.ThrowIfNull(book);
        db.Books.Remove(book);
    }

    public Task AddRangeAsync(IEnumerable<Book> books, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(books);
        return db.Books.AddRangeAsync(books, cancellationToken);
    }

    public Task<bool> IsbnExistsAsync(string isbn, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(isbn))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Isbn"] = ["ISBN is required when checking uniqueness."]
            });
        }

        var normalized = NormalizeIsbn(isbn)!;
        var query = db.Books.AsNoTracking().Where(b => b.Isbn == normalized);
        if (excludeId.HasValue)
        {
            EnsureValidId(excludeId.Value);
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task<bool> InventoryNumberExistsAsync(string inventoryNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(inventoryNumber))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["InventoryNumber"] = ["Inventory number is required when checking uniqueness."]
            });
        }

        return db.BookCopies.AsNoTracking()
            .AnyAsync(c => c.InventoryNumber == inventoryNumber.Trim(), cancellationToken);
    }

    public Task<bool> BarcodeExistsAsync(string barcode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(barcode))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Barcode"] = ["Barcode is required when checking uniqueness."]
            });
        }

        return db.BookCopies.AsNoTracking()
            .AnyAsync(c => c.Barcode == barcode.Trim(), cancellationToken);
    }

    private static IQueryable<Book> ApplyFilters(IQueryable<Book> query, BookQueryFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Title))
        {
            var title = filter.Title.Trim();
            query = query.Where(b => EF.Functions.Like(b.Title, $"%{title}%"));
        }

        if (!string.IsNullOrWhiteSpace(filter.Author))
        {
            var author = filter.Author.Trim();
            query = query.Where(b => EF.Functions.Like(b.Author, $"%{author}%"));
        }

        if (!string.IsNullOrWhiteSpace(filter.Publisher))
        {
            var publisher = filter.Publisher.Trim();
            query = query.Where(b => b.Publisher != null && EF.Functions.Like(b.Publisher, $"%{publisher}%"));
        }

        if (!string.IsNullOrWhiteSpace(filter.Isbn))
        {
            var isbn = NormalizeIsbn(filter.Isbn)!;
            query = query.Where(b => b.Isbn == isbn);
        }

        if (!string.IsNullOrWhiteSpace(filter.Language))
        {
            var language = filter.Language.Trim();
            query = query.Where(b => b.Language != null && EF.Functions.Like(b.Language, $"%{language}%"));
        }

        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            var category = filter.Category.Trim();
            query = query.Where(b => b.Category != null && EF.Functions.Like(b.Category, $"%{category}%"));
        }

        if (!string.IsNullOrWhiteSpace(filter.ShelfLocation))
        {
            var shelf = filter.ShelfLocation.Trim();
            query = query.Where(b => b.ShelfLocation != null && EF.Functions.Like(b.ShelfLocation, $"%{shelf}%"));
        }

        if (filter.PublishedYear.HasValue)
        {
            query = query.Where(b => b.PublishedYear == filter.PublishedYear.Value);
        }

        if (filter.PublishedYearFrom.HasValue)
        {
            query = query.Where(b => b.PublishedYear != null && b.PublishedYear >= filter.PublishedYearFrom.Value);
        }

        if (filter.PublishedYearTo.HasValue)
        {
            query = query.Where(b => b.PublishedYear != null && b.PublishedYear <= filter.PublishedYearTo.Value);
        }

        if (filter.Format.HasValue)
        {
            query = query.Where(b => b.Format == filter.Format.Value);
        }

        if (filter.AvailableOnly == true)
        {
            query = query.Where(b => b.AvailableCopies > 0);
        }

        if (!string.IsNullOrWhiteSpace(filter.InventoryNumber))
        {
            var inventory = filter.InventoryNumber.Trim();
            query = query.Where(b => b.Copies.Any(c => c.InventoryNumber == inventory));
        }

        if (!string.IsNullOrWhiteSpace(filter.Barcode))
        {
            var barcode = filter.Barcode.Trim();
            query = query.Where(b => b.Copies.Any(c => c.Barcode == barcode));
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim();
            var normalizedSearchIsbn = NormalizeIsbn(search);
            query = query.Where(b =>
                EF.Functions.Like(b.Title, $"%{search}%") ||
                EF.Functions.Like(b.Author, $"%{search}%") ||
                (b.Subtitle != null && EF.Functions.Like(b.Subtitle, $"%{search}%")) ||
                (b.Isbn != null && (
                    EF.Functions.Like(b.Isbn, $"%{search}%") ||
                    (normalizedSearchIsbn != null && b.Isbn == normalizedSearchIsbn))) ||
                (b.Category != null && EF.Functions.Like(b.Category, $"%{search}%")) ||
                b.Copies.Any(c =>
                    EF.Functions.Like(c.InventoryNumber, $"%{search}%") ||
                    (c.Barcode != null && EF.Functions.Like(c.Barcode, $"%{search}%"))));
        }

        return query;
    }

    private static void ValidateFilter(BookQueryFilter filter)
    {
        var errors = filter.Validate().ToDictionary(
            pair => pair.Key,
            pair => pair.Value.ToList(),
            StringComparer.OrdinalIgnoreCase);

        void Add(string field, string message)
        {
            if (!errors.TryGetValue(field, out var list))
            {
                list = [];
                errors[field] = list;
            }

            list.Add(message);
        }

        if (filter.PublishedYearFrom.HasValue &&
            filter.PublishedYearTo.HasValue &&
            filter.PublishedYearFrom > filter.PublishedYearTo)
        {
            Add(nameof(BookQueryFilter.PublishedYearFrom), "PublishedYearFrom cannot be greater than PublishedYearTo.");
        }

        if (filter.Format.HasValue && !Enum.IsDefined(filter.Format.Value))
        {
            Add(nameof(BookQueryFilter.Format), "Format must be a valid book format.");
        }

        if (!string.IsNullOrWhiteSpace(filter.Isbn))
        {
            var normalized = NormalizeIsbn(filter.Isbn);
            if (normalized is null || !IsValidIsbn(normalized))
            {
                Add(nameof(BookQueryFilter.Isbn), "ISBN must be a valid ISBN-10 or ISBN-13.");
            }
        }

        if (errors.Count > 0)
        {
            throw new AppValidationException(
                errors.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray(), StringComparer.OrdinalIgnoreCase));
        }
    }

    private static void EnsureValidId(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Id"] = ["Id must be a non-empty GUID."]
            });
        }
    }

    private static string? NormalizeIsbn(string? isbn)
    {
        if (string.IsNullOrWhiteSpace(isbn))
        {
            return null;
        }

        return new string(isbn.Where(c => c is not ('-' or ' ')).ToArray());
    }

    private static bool IsValidIsbn(string value)
        => System.Text.RegularExpressions.Regex.IsMatch(value, @"^(97[89]\d{10}|\d{9}[\dXx])$");
}

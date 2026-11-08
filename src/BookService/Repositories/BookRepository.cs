using System.Linq.Expressions;
using BookService.Data;
using BookService.DTOs;
using BookService.Exceptions;
using BookService.Interfaces;
using BookService.Models;
using Microsoft.EntityFrameworkCore;

namespace BookService.Repositories;

public class BookRepository(BookDbContext db) : IBookRepository
{
    public async Task<PagedResult<Book>> FindAsync(
        BookQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);
        ValidateFilter(filter);

        var query = db.Books.AsNoTracking().AsQueryable();
        query = ApplyFilters(query, filter);

        var totalCount = await query.CountAsync(cancellationToken);
        query = ApplySorting(query, filter.SortBy, filter.SortDir);

        var page = Math.Max(filter.Page, 1);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Book>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public Task<Book?> GetByIdAsync(Guid id, bool includeCopies = false, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);

        IQueryable<Book> query = db.Books;
        if (includeCopies)
        {
            query = query.Include(b => b.Copies);
        }

        return query.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task AddAsync(Book book, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(book);
        await db.Books.AddAsync(book, cancellationToken);
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

    private static IQueryable<Book> ApplySorting(IQueryable<Book> query, string? sortBy, string? sortDir)
    {
        var descending = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);

        Expression<Func<Book, object>> key = (sortBy ?? "title").Trim().ToLowerInvariant() switch
        {
            "author" => b => b.Author,
            "publisher" => b => b.Publisher ?? string.Empty,
            "publishedyear" or "year" => b => b.PublishedYear ?? 0,
            "category" => b => b.Category ?? string.Empty,
            "createdat" => b => b.CreatedAt,
            "updatedat" => b => b.UpdatedAt,
            "totalcopies" => b => b.TotalCopies,
            "availablecopies" => b => b.AvailableCopies,
            "isbn" => b => b.Isbn ?? string.Empty,
            _ => b => b.Title
        };

        return descending ? query.OrderByDescending(key) : query.OrderBy(key);
    }

    private static void ValidateFilter(BookQueryFilter filter)
    {
        var errors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        void Add(string field, string message)
        {
            if (!errors.TryGetValue(field, out var list))
            {
                list = [];
                errors[field] = list;
            }

            list.Add(message);
        }

        if (filter.Page < 1)
        {
            Add(nameof(BookQueryFilter.Page), "Page must be greater than or equal to 1.");
        }

        if (filter.PageSize < 1 || filter.PageSize > 100)
        {
            Add(nameof(BookQueryFilter.PageSize), "PageSize must be between 1 and 100.");
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
    {
        return System.Text.RegularExpressions.Regex.IsMatch(
            value,
            @"^(97[89]\d{10}|\d{9}[\dXx])$");
    }
}

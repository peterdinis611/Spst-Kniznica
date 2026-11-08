using BookService.Data;
using BookService.DTOs;
using BookService.Exceptions;
using BookService.Interfaces;
using BookService.Models;
using Microsoft.EntityFrameworkCore;

namespace BookService.Repositories;

public class BookRepository(BookDbContext db) : IBookRepository
{
    private static readonly DateTimeOffset MinCreatedAt = new(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);

    public async Task<IReadOnlyList<Book>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await FindAsync(new BookQueryFilter(), cancellationToken);
    }

    public async Task<IReadOnlyList<Book>> FindAsync(
        BookQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(filter);
        ValidateFilter(filter);

        var query = db.Books.AsNoTracking().AsQueryable();

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
                (b.Category != null && EF.Functions.Like(b.Category, $"%{search}%")));
        }

        return await query
            .OrderBy(b => b.Title)
            .ToListAsync(cancellationToken);
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
            throw new RepositoryValidationException(
                errors.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray(), StringComparer.OrdinalIgnoreCase));
        }
    }

    public Task<Book?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        return db.Books
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<Book> AddAsync(Book book, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(book);
        await ValidateForPersistAsync(book, excludeId: null, cancellationToken);

        if (book.Id == Guid.Empty)
        {
            book.Id = Guid.NewGuid();
        }

        var now = DateTimeOffset.UtcNow;
        if (book.CreatedAt < MinCreatedAt)
        {
            book.CreatedAt = now;
        }

        book.UpdatedAt = now;

        db.Books.Add(book);
        await db.SaveChangesAsync(cancellationToken);
        return book;
    }

    public async Task<Book?> UpdateAsync(Guid id, Book updated, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);
        ArgumentNullException.ThrowIfNull(updated);

        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (book is null)
        {
            return null;
        }

        await ValidateForPersistAsync(updated, excludeId: id, cancellationToken);

        book.Title = updated.Title;
        book.Subtitle = updated.Subtitle;
        book.Author = updated.Author;
        book.Publisher = updated.Publisher;
        book.Isbn = updated.Isbn;
        book.PublishedYear = updated.PublishedYear;
        book.Language = updated.Language;
        book.Category = updated.Category;
        book.Description = updated.Description;
        book.PageCount = updated.PageCount;
        book.Format = updated.Format;
        book.ShelfLocation = updated.ShelfLocation;
        book.TotalCopies = updated.TotalCopies;
        book.AvailableCopies = updated.AvailableCopies;
        book.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return book;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureValidId(id);

        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (book is null)
        {
            return false;
        }

        if (book.AvailableCopies < book.TotalCopies)
        {
            throw new RepositoryValidationException(new Dictionary<string, string[]>
            {
                ["AvailableCopies"] =
                [
                    "Cannot delete a book while some copies are borrowed."
                ]
            });
        }

        db.Books.Remove(book);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public Task<bool> IsbnExistsAsync(string isbn, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(isbn))
        {
            throw new RepositoryValidationException(new Dictionary<string, string[]>
            {
                ["Isbn"] = ["ISBN is required when checking uniqueness."]
            });
        }

        var normalized = NormalizeIsbn(isbn);
        var query = db.Books.AsNoTracking().Where(b => b.Isbn == normalized);
        if (excludeId.HasValue)
        {
            EnsureValidId(excludeId.Value);
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    private async Task ValidateForPersistAsync(Book book, Guid? excludeId, CancellationToken cancellationToken)
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

        if (string.IsNullOrWhiteSpace(book.Title))
        {
            Add(nameof(Book.Title), "Title is required.");
        }
        else if (book.Title.Length > 300)
        {
            Add(nameof(Book.Title), "Title must be at most 300 characters.");
        }

        if (string.IsNullOrWhiteSpace(book.Author))
        {
            Add(nameof(Book.Author), "Author is required.");
        }
        else if (book.Author.Length > 200)
        {
            Add(nameof(Book.Author), "Author must be at most 200 characters.");
        }

        ValidateOptionalLength(book.Subtitle, nameof(Book.Subtitle), 300, Add);
        ValidateOptionalLength(book.Publisher, nameof(Book.Publisher), 200, Add);
        ValidateOptionalLength(book.Language, nameof(Book.Language), 50, Add);
        ValidateOptionalLength(book.Category, nameof(Book.Category), 100, Add);
        ValidateOptionalLength(book.Description, nameof(Book.Description), 4000, Add);
        ValidateOptionalLength(book.ShelfLocation, nameof(Book.ShelfLocation), 50, Add);

        if (book.Isbn is not null)
        {
            var normalizedIsbn = NormalizeIsbn(book.Isbn);
            if (normalizedIsbn is null)
            {
                Add(nameof(Book.Isbn), "ISBN cannot be empty or whitespace.");
            }
            else if (normalizedIsbn.Length > 32)
            {
                Add(nameof(Book.Isbn), "ISBN must be at most 32 characters.");
            }
            else if (!IsValidIsbn(normalizedIsbn))
            {
                Add(nameof(Book.Isbn), "ISBN must be a valid ISBN-10 or ISBN-13.");
            }
            else
            {
                book.Isbn = normalizedIsbn;
                if (await IsbnExistsInternalAsync(normalizedIsbn, excludeId, cancellationToken))
                {
                    Add(nameof(Book.Isbn), "A book with this ISBN already exists.");
                }
            }
        }

        var maxYear = DateTime.UtcNow.Year + 1;
        if (book.PublishedYear.HasValue &&
            (book.PublishedYear.Value < 1450 || book.PublishedYear.Value > maxYear))
        {
            Add(nameof(Book.PublishedYear), $"Published year must be between 1450 and {maxYear}.");
        }

        if (book.PageCount is <= 0)
        {
            Add(nameof(Book.PageCount), "Page count must be greater than 0.");
        }

        if (!Enum.IsDefined(book.Format))
        {
            Add(nameof(Book.Format), "Format must be a valid book format.");
        }

        if (book.TotalCopies < 1)
        {
            Add(nameof(Book.TotalCopies), "Total copies must be at least 1.");
        }

        if (book.AvailableCopies < 0)
        {
            Add(nameof(Book.AvailableCopies), "Available copies cannot be negative.");
        }

        if (book.AvailableCopies > book.TotalCopies)
        {
            Add(nameof(Book.AvailableCopies), "Available copies cannot exceed total copies.");
        }

        if (errors.Count > 0)
        {
            throw new RepositoryValidationException(
                errors.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray(), StringComparer.OrdinalIgnoreCase));
        }
    }

    private Task<bool> IsbnExistsInternalAsync(string isbn, Guid? excludeId, CancellationToken cancellationToken)
    {
        var query = db.Books.AsNoTracking().Where(b => b.Isbn == isbn);
        if (excludeId.HasValue)
        {
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    private static void EnsureValidId(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new RepositoryValidationException(new Dictionary<string, string[]>
            {
                ["Id"] = ["Id must be a non-empty GUID."]
            });
        }
    }

    private static void ValidateOptionalLength(
        string? value,
        string field,
        int maxLength,
        Action<string, string> add)
    {
        if (value is not null && value.Length > maxLength)
        {
            add(field, $"{field} must be at most {maxLength} characters.");
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

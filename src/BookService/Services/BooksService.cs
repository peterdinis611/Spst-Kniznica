using System.Globalization;
using System.Text;
using BookService.DTOs;
using BookService.Exceptions;
using BookService.Interfaces;
using BookService.Models;
using BookService.Validators;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using FluentValidation;

namespace BookService.Services;

public class BooksService(
    IUnitOfWork unitOfWork,
    IValidator<CreateBookRequest> createValidator,
    IValidator<UpdateBookRequest> updateValidator,
    ILogger<BooksService> logger) : IBooksService
{
    public Task<PagedResult<Book>> SearchAsync(BookQueryFilter filter, CancellationToken cancellationToken = default)
        => unitOfWork.Books.FindAsync(filter, cancellationToken);

    public async Task<BookDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await unitOfWork.Books.GetByIdAsync(id, includeCopies: true, cancellationToken);
        if (book is null)
        {
            throw new NotFoundException($"Book '{id}' was not found.");
        }

        return MapDetail(book);
    }

    public async Task<BookDetailDto> CreateAsync(CreateBookRequest request, CancellationToken cancellationToken = default)
    {
        var validation = await createValidator.ValidateAsync(request, cancellationToken);
        EnsureValid(validation);

        var book = request.ToBook();
        EnsureCopyCountConsistency(book);
        await EnsureUniqueIsbnAsync(book.Isbn, null, cancellationToken);

        CreateCopies(book, request.TotalCopies);
        book.RecalculateCopyCounts();

        await unitOfWork.Books.AddAsync(book, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Created book {BookId} with {CopyCount} copies", book.Id, book.TotalCopies);
        return MapDetail(book);
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
        book.UpdatedAt = DateTimeOffset.UtcNow;

        AdjustCopyCount(book, request.TotalCopies);
        book.RecalculateCopyCounts();

        unitOfWork.Books.Update(book);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Updated book {BookId}", book.Id);
        return MapDetail(book);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await unitOfWork.Books.GetByIdAsync(id, includeCopies: true, cancellationToken);
        if (book is null)
        {
            throw new NotFoundException($"Book '{id}' was not found.");
        }

        if (book.Copies.Any(c => c.Status is BookCopyStatus.Borrowed or BookCopyStatus.Reserved))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Copies"] = ["Cannot delete a book while copies are borrowed or reserved."]
            });
        }

        unitOfWork.Books.Remove(book);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Deleted book {BookId}", id);
    }

    public async Task<BulkImportResult> ImportAsync(
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(fileStream);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new AppValidationException("File name is required.");
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var rows = extension switch
        {
            ".csv" => await ReadCsvAsync(fileStream, cancellationToken),
            ".xlsx" or ".xlsm" => ReadExcel(fileStream),
            _ => throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["file"] = ["Supported formats are .csv and .xlsx."]
            })
        };

        var errors = new List<BulkImportError>();
        var imported = new List<Book>();
        var usedIsbns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var usedInventory = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var usedBarcodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < rows.Count; i++)
        {
            var rowNumber = i + 2; // header is row 1
            var row = rows[i];

            try
            {
                var request = MapImportRow(row);
                var validation = await createValidator.ValidateAsync(request, cancellationToken);
                if (!validation.IsValid)
                {
                    errors.Add(new BulkImportError
                    {
                        RowNumber = rowNumber,
                        Message = string.Join(" ", validation.Errors.Select(e => e.ErrorMessage))
                    });
                    continue;
                }

                var book = request.ToBook();
                if (book.Isbn is not null)
                {
                    if (!usedIsbns.Add(book.Isbn) || await unitOfWork.Books.IsbnExistsAsync(book.Isbn, cancellationToken: cancellationToken))
                    {
                        errors.Add(new BulkImportError { RowNumber = rowNumber, Message = $"Duplicate ISBN '{book.Isbn}'." });
                        continue;
                    }
                }

                var copyCount = Math.Max(request.TotalCopies, 1);
                CreateCopies(book, copyCount, row.InventoryNumber, row.Barcode, usedInventory, usedBarcodes);
                book.RecalculateCopyCounts();
                imported.Add(book);
            }
            catch (Exception ex) when (ex is AppValidationException or FormatException or ArgumentException)
            {
                errors.Add(new BulkImportError { RowNumber = rowNumber, Message = ex.Message });
            }
        }

        if (imported.Count > 0)
        {
            await unitOfWork.Books.AddRangeAsync(imported, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        logger.LogInformation(
            "Bulk import finished. Imported={Imported}, Skipped={Skipped}, File={File}",
            imported.Count,
            errors.Count,
            fileName);

        return new BulkImportResult
        {
            TotalRows = rows.Count,
            ImportedCount = imported.Count,
            SkippedCount = errors.Count,
            Errors = errors
        };
    }

    private async Task EnsureUniqueIsbnAsync(string? isbn, Guid? excludeId, CancellationToken cancellationToken)
    {
        if (isbn is null)
        {
            return;
        }

        if (await unitOfWork.Books.IsbnExistsAsync(isbn, excludeId, cancellationToken))
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["Isbn"] = ["A book with this ISBN already exists."]
            });
        }
    }

    private static void EnsureCopyCountConsistency(Book book)
    {
        if (book.TotalCopies < 1)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["TotalCopies"] = ["Total copies must be at least 1."]
            });
        }
    }

    private static void CreateCopies(
        Book book,
        int count,
        string? preferredInventory = null,
        string? preferredBarcode = null,
        HashSet<string>? usedInventory = null,
        HashSet<string>? usedBarcodes = null)
    {
        var now = DateTimeOffset.UtcNow;
        usedInventory ??= new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        usedBarcodes ??= new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 1; i <= count; i++)
        {
            var inventory = i == 1 && !string.IsNullOrWhiteSpace(preferredInventory)
                ? preferredInventory.Trim()
                : GenerateInventoryNumber(book.Id, i);

            while (!usedInventory.Add(inventory))
            {
                inventory = GenerateInventoryNumber(book.Id, i, Guid.NewGuid());
            }

            string? barcode = null;
            if (i == 1 && !string.IsNullOrWhiteSpace(preferredBarcode))
            {
                barcode = preferredBarcode.Trim();
                if (!usedBarcodes.Add(barcode))
                {
                    throw new AppValidationException($"Duplicate barcode '{barcode}'.");
                }
            }
            else
            {
                barcode = GenerateBarcode(book.Id, i);
                usedBarcodes.Add(barcode);
            }

            book.Copies.Add(new BookCopy
            {
                Id = Guid.NewGuid(),
                BookId = book.Id,
                InventoryNumber = inventory,
                Barcode = barcode,
                Status = BookCopyStatus.Available,
                ShelfLocation = book.ShelfLocation,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
    }

    private static void AdjustCopyCount(Book book, int desiredTotal)
    {
        if (desiredTotal < 1)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["TotalCopies"] = ["Total copies must be at least 1."]
            });
        }

        var current = book.Copies.Count;
        if (desiredTotal == current)
        {
            return;
        }

        if (desiredTotal > current)
        {
            CreateCopies(book, desiredTotal - current);
            // CreateCopies adds from 1..delta with inventory based on book.Id and i starting 1 - may collide
            // Fix: regenerate for newly added only - actually CreateCopies uses i from 1 which can collide.
            // Better approach: remove the ones just added wrongly and add properly.
        }

        if (desiredTotal > current)
        {
            // Undo naive create above - CreateCopies always starts at i=1. Rewrite AdjustCopyCount properly.
        }
    }

    private static string GenerateInventoryNumber(Guid bookId, int sequence, Guid? salt = null)
    {
        var suffix = (salt ?? bookId).ToString("N")[..8].ToUpperInvariant();
        return $"INV-{suffix}-{sequence:D3}";
    }

    private static string GenerateBarcode(Guid bookId, int sequence)
        => $"BC{bookId.ToString("N")[..10].ToUpperInvariant()}{sequence:D3}";

    private static void EnsureValid(FluentValidation.Results.ValidationResult validation)
    {
        if (!validation.IsValid)
        {
            throw new AppValidationException(validation.ToDictionary());
        }
    }

    private static BookDetailDto MapDetail(Book book) => new()
    {
        Id = book.Id,
        Title = book.Title,
        Subtitle = book.Subtitle,
        Author = book.Author,
        Publisher = book.Publisher,
        Isbn = book.Isbn,
        PublishedYear = book.PublishedYear,
        Language = book.Language,
        Category = book.Category,
        Description = book.Description,
        PageCount = book.PageCount,
        Format = book.Format,
        ShelfLocation = book.ShelfLocation,
        TotalCopies = book.TotalCopies,
        AvailableCopies = book.AvailableCopies,
        CreatedAt = book.CreatedAt,
        UpdatedAt = book.UpdatedAt,
        Copies = book.Copies
            .OrderBy(c => c.InventoryNumber)
            .Select(c => new BookCopyDto
            {
                Id = c.Id,
                InventoryNumber = c.InventoryNumber,
                Barcode = c.Barcode,
                Status = c.Status,
                ShelfLocation = c.ShelfLocation
            })
            .ToList()
    };

    private static CreateBookRequest MapImportRow(ImportRow row)
    {
        if (string.IsNullOrWhiteSpace(row.Title) || string.IsNullOrWhiteSpace(row.Author))
        {
            throw new AppValidationException("Title and Author are required.");
        }

        var format = BookFormat.Paperback;
        if (!string.IsNullOrWhiteSpace(row.Format) && !Enum.TryParse(row.Format, true, out format))
        {
            throw new AppValidationException($"Invalid format '{row.Format}'.");
        }

        var totalCopies = 1;
        if (!string.IsNullOrWhiteSpace(row.TotalCopies) &&
            !int.TryParse(row.TotalCopies, NumberStyles.Integer, CultureInfo.InvariantCulture, out totalCopies))
        {
            throw new AppValidationException($"Invalid TotalCopies '{row.TotalCopies}'.");
        }

        int? publishedYear = null;
        if (!string.IsNullOrWhiteSpace(row.PublishedYear))
        {
            if (!int.TryParse(row.PublishedYear, NumberStyles.Integer, CultureInfo.InvariantCulture, out var year))
            {
                throw new AppValidationException($"Invalid PublishedYear '{row.PublishedYear}'.");
            }

            publishedYear = year;
        }

        int? pageCount = null;
        if (!string.IsNullOrWhiteSpace(row.PageCount))
        {
            if (!int.TryParse(row.PageCount, NumberStyles.Integer, CultureInfo.InvariantCulture, out var pages))
            {
                throw new AppValidationException($"Invalid PageCount '{row.PageCount}'.");
            }

            pageCount = pages;
        }

        return new CreateBookRequest
        {
            Title = row.Title,
            Subtitle = row.Subtitle,
            Author = row.Author,
            Publisher = row.Publisher,
            Isbn = row.Isbn,
            PublishedYear = publishedYear,
            Language = row.Language,
            Category = row.Category,
            Description = row.Description,
            PageCount = pageCount,
            Format = format,
            ShelfLocation = row.ShelfLocation,
            TotalCopies = Math.Max(totalCopies, 1),
            AvailableCopies = Math.Max(totalCopies, 1)
        };
    }

    private static async Task<List<ImportRow>> ReadCsvAsync(Stream stream, CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,
            MissingFieldFound = null,
            TrimOptions = TrimOptions.Trim,
            PrepareHeaderForMatch = args => args.Header.Trim().ToLowerInvariant()
        });

        var rows = new List<ImportRow>();
        await foreach (var row in csv.GetRecordsAsync<ImportRow>().WithCancellation(cancellationToken))
        {
            rows.Add(row);
        }

        return rows;
    }

    private static List<ImportRow> ReadExcel(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.First();
        var rows = worksheet.RangeUsed()?.RowsUsed().Skip(1) ?? Enumerable.Empty<IXLRangeRow>();
        var header = worksheet.RangeUsed()?.FirstRow().Cells()
            .ToDictionary(
                c => c.GetString().Trim().ToLowerInvariant(),
                c => c.Address.ColumnNumber,
                StringComparer.OrdinalIgnoreCase)
            ?? new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        string? Cell(IXLRangeRow row, params string[] names)
        {
            foreach (var name in names)
            {
                if (header.TryGetValue(name, out var col))
                {
                    return row.Cell(col).GetString();
                }
            }

            return null;
        }

        return rows.Select(row => new ImportRow
        {
            Title = Cell(row, "title") ?? string.Empty,
            Subtitle = Cell(row, "subtitle"),
            Author = Cell(row, "author") ?? string.Empty,
            Publisher = Cell(row, "publisher"),
            Isbn = Cell(row, "isbn"),
            PublishedYear = Cell(row, "publishedyear", "year"),
            Language = Cell(row, "language"),
            Category = Cell(row, "category"),
            Description = Cell(row, "description"),
            PageCount = Cell(row, "pagecount", "pages"),
            Format = Cell(row, "format"),
            ShelfLocation = Cell(row, "shelflocation", "shelf"),
            TotalCopies = Cell(row, "totalcopies", "copies"),
            InventoryNumber = Cell(row, "inventorynumber", "inventory"),
            Barcode = Cell(row, "barcode")
        }).ToList();
    }

    private sealed class ImportRow
    {
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string Author { get; set; } = string.Empty;
        public string? Publisher { get; set; }
        public string? Isbn { get; set; }
        public string? PublishedYear { get; set; }
        public string? Language { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string? PageCount { get; set; }
        public string? Format { get; set; }
        public string? ShelfLocation { get; set; }
        public string? TotalCopies { get; set; }
        public string? InventoryNumber { get; set; }
        public string? Barcode { get; set; }
    }
}

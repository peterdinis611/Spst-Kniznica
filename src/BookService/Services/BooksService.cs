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
using SpstKniznica.Common.Pagination;

namespace BookService.Services;

public class BooksService(
    IUnitOfWork unitOfWork,
    IValidator<CreateBookRequest> createValidator,
    IValidator<UpdateBookRequest> updateValidator,
    ILogger<BooksService> logger) : IBooksService
{
    public async Task<PagedResult<BookListItemDto>> SearchAsync(
        BookQueryFilter filter,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug(
            "Searching books. Page={Page}, PageSize={PageSize}, Search={Search}, Category={Category}",
            filter.Page,
            filter.PageSize,
            filter.Search,
            filter.Category);

        var result = await unitOfWork.Books.FindAsync(filter, cancellationToken);

        logger.LogDebug(
            "Books search finished. TotalCount={TotalCount}, PageItems={PageItems}",
            result.TotalCount,
            result.Items.Count);

        return result;
    }

    public async Task<BookDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await unitOfWork.Books.GetByIdAsync(id, includeCopies: true, cancellationToken);
        if (book is null)
        {
            logger.LogWarning("Book {BookId} was not found", id);
            throw new NotFoundException($"Book '{id}' was not found.");
        }

        logger.LogDebug("Loaded book {BookId} with {CopyCount} copies", book.Id, book.Copies.Count);
        return MapDetail(book);
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
        EnsureCopyCountConsistency(book);
        await EnsureUniqueIsbnAsync(book.Isbn, null, cancellationToken);

        CreateCopies(book, request.TotalCopies);
        book.RecalculateCopyCounts();

        await unitOfWork.Books.AddAsync(book, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Created book {BookId} titled '{Title}' with {CopyCount} copies and ISBN {Isbn}",
            book.Id,
            book.Title,
            book.TotalCopies,
            book.Isbn);
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

        logger.LogInformation(
            "Updated book {BookId}. Title='{Title}', TotalCopies={TotalCopies}, AvailableCopies={AvailableCopies}",
            book.Id,
            book.Title,
            book.TotalCopies,
            book.AvailableCopies);
        return MapDetail(book);
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
        logger.LogInformation("Deleted book {BookId} titled '{Title}'", id, book.Title);
    }

    public Task<BulkImportResult> ImportCsvAsync(Stream fileStream, CancellationToken cancellationToken = default)
        => ImportAsync(fileStream, "import.csv", cancellationToken);

    public Task<BulkImportResult> ImportXmlAsync(Stream fileStream, CancellationToken cancellationToken = default)
        => ImportAsync(fileStream, "import.xml", cancellationToken);

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
        logger.LogInformation("Parsing import file {FileName} as {Format}", fileName, extension);

        List<ImportRow> rows;
        try
        {
            rows = extension switch
            {
                ".csv" => await ReadCsvAsync(fileStream, cancellationToken),
                ".xml" => await ReadXmlAsync(fileStream, cancellationToken),
                ".xlsx" or ".xlsm" => ReadExcel(fileStream),
                _ => throw new AppValidationException(new Dictionary<string, string[]>
                {
                    ["file"] = ["Supported formats are .csv, .xml and .xlsx."]
                })
            };
        }
        catch (Exception ex) when (ex is not AppValidationException)
        {
            logger.LogError(ex, "Failed to parse import file {FileName}", fileName);
            throw;
        }

        logger.LogInformation("Parsed {RowCount} rows from {FileName}", rows.Count, fileName);

        var errors = new List<BulkImportError>();
        var imported = new List<Book>();
        var usedIsbns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var usedInventory = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var usedBarcodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < rows.Count; i++)
        {
            var rowNumber = i + 1;
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
            catch (Exception ex) when (ex is AppValidationException or FormatException or ArgumentException or InvalidOperationException)
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
            var now = DateTimeOffset.UtcNow;
            var existingInventory = book.Copies.Select(c => c.InventoryNumber).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var existingBarcodes = book.Copies
                .Where(c => c.Barcode is not null)
                .Select(c => c.Barcode!)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var sequence = current + 1;
            while (book.Copies.Count < desiredTotal)
            {
                var inventory = GenerateInventoryNumber(book.Id, sequence);
                while (!existingInventory.Add(inventory))
                {
                    sequence++;
                    inventory = GenerateInventoryNumber(book.Id, sequence, Guid.NewGuid());
                }

                var barcode = GenerateBarcode(book.Id, sequence);
                while (!existingBarcodes.Add(barcode))
                {
                    sequence++;
                    barcode = GenerateBarcode(book.Id, sequence);
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
                sequence++;
            }

            return;
        }

        var removable = book.Copies
            .Where(c => c.Status == BookCopyStatus.Available)
            .OrderByDescending(c => c.CreatedAt)
            .Take(current - desiredTotal)
            .ToList();

        if (removable.Count < current - desiredTotal)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["TotalCopies"] = ["Cannot reduce copies below the number of non-available exemplars."]
            });
        }

        foreach (var copy in removable)
        {
            book.Copies.Remove(copy);
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
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,
            MissingFieldFound = null,
            TrimOptions = TrimOptions.Trim,
            PrepareHeaderForMatch = args => args.Header.Trim().ToLowerInvariant()
        };
        using var csv = new CsvReader(reader, config);

        var rows = new List<ImportRow>();
        await foreach (var row in csv.GetRecordsAsync<ImportRow>().WithCancellation(cancellationToken))
        {
            rows.Add(row);
        }

        return rows;
    }

    private static async Task<List<ImportRow>> ReadXmlAsync(Stream stream, CancellationToken cancellationToken)
    {
        XDocument document;
        try
        {
            document = await XDocument.LoadAsync(stream, System.Xml.Linq.LoadOptions.None, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["file"] = [$"Invalid XML file: {ex.Message}"]
            });
        }

        var bookElements = document.Root?
            .Elements()
            .Where(e => e.Name.LocalName.Equals("book", StringComparison.OrdinalIgnoreCase))
            .ToList()
            ?? [];

        if (bookElements.Count == 0 && document.Root is not null &&
            document.Root.Name.LocalName.Equals("book", StringComparison.OrdinalIgnoreCase))
        {
            bookElements = [document.Root];
        }

        if (bookElements.Count == 0)
        {
            throw new AppValidationException(new Dictionary<string, string[]>
            {
                ["file"] = ["XML must contain <books><book>...</book></books> elements."]
            });
        }

        static string? Value(XElement book, params string[] names)
        {
            foreach (var name in names)
            {
                var element = book.Elements()
                    .FirstOrDefault(e => e.Name.LocalName.Equals(name, StringComparison.OrdinalIgnoreCase));
                if (element is not null)
                {
                    return element.Value.Trim();
                }

                var attribute = book.Attributes()
                    .FirstOrDefault(a => a.Name.LocalName.Equals(name, StringComparison.OrdinalIgnoreCase));
                if (attribute is not null)
                {
                    return attribute.Value.Trim();
                }
            }

            return null;
        }

        return bookElements.Select(book => new ImportRow
        {
            Title = Value(book, "title") ?? string.Empty,
            Subtitle = Value(book, "subtitle"),
            Author = Value(book, "author") ?? string.Empty,
            Publisher = Value(book, "publisher"),
            Isbn = Value(book, "isbn"),
            PublishedYear = Value(book, "publishedYear", "year"),
            Language = Value(book, "language"),
            Category = Value(book, "category"),
            Description = Value(book, "description"),
            PageCount = Value(book, "pageCount", "pages"),
            Format = Value(book, "format"),
            ShelfLocation = Value(book, "shelfLocation", "shelf"),
            TotalCopies = Value(book, "totalCopies", "copies"),
            InventoryNumber = Value(book, "inventoryNumber", "inventory"),
            Barcode = Value(book, "barcode")
        }).ToList();
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

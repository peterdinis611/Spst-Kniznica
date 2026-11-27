namespace BookService.DTOs;

public sealed class BookCatalogSnapshot
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
}

/// <summary>Service-to-service lendability of a single physical copy.</summary>
public sealed class BookCopyLendabilityDto
{
    public Guid CopyId { get; set; }
    public Guid BookId { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsLendable { get; set; }
}

public sealed class BookSummariesRequest
{
    public List<Guid>? Ids { get; set; }
}

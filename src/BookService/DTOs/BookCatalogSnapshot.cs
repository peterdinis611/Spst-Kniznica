namespace BookService.DTOs;

public sealed class BookCatalogSnapshot
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
}

public sealed class BookSummariesRequest
{
    public List<Guid>? Ids { get; set; }
}

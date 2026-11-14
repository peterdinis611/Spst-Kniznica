namespace BookService.Models;

public class Book
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Subtitle { get; set; }
    public Guid? AuthorId { get; set; }
    public required string Author { get; set; }
    public string? Publisher { get; set; }
    public string? Isbn { get; set; }
    public int? PublishedYear { get; set; }
    public string? Language { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? Description { get; set; }
    /// <summary>Cover image URL (Open Library or override).</summary>
    public string? CoverUrl { get; set; }
    public int? PageCount { get; set; }
    public BookFormat Format { get; set; } = BookFormat.Paperback;
    public string? ShelfLocation { get; set; }
    public int TotalCopies { get; set; } = 1;
    public int AvailableCopies { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public ICollection<BookCopy> Copies { get; set; } = new List<BookCopy>();

    public void RecalculateCopyCounts()
    {
        TotalCopies = Copies.Count;
        AvailableCopies = Copies.Count(c => c.Status == BookCopyStatus.Available);
    }
}

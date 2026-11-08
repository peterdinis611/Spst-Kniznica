namespace BookService.Models;

public class Book
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Subtitle { get; set; }
    public required string Author { get; set; }
    public string? Publisher { get; set; }
    public string? Isbn { get; set; }
    public int? PublishedYear { get; set; }
    public string? Language { get; set; }
    public string? Category { get; set; }
    public string? Description { get; set; }
    public int? PageCount { get; set; }
    public BookFormat Format { get; set; } = BookFormat.Paperback;
    public string? ShelfLocation { get; set; }
    public int TotalCopies { get; set; } = 1;
    public int AvailableCopies { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

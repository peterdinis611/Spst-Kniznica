using BookService.Models;

namespace BookService.DTOs;

public class BookListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public Guid? AuthorId { get; set; }
    public string Author { get; set; } = string.Empty;
    public string? Publisher { get; set; }
    public string? Isbn { get; set; }
    public int? PublishedYear { get; set; }
    public string? Language { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public BookFormat Format { get; set; }
    public string? CoverUrl { get; set; }
    public string? ShelfLocation { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

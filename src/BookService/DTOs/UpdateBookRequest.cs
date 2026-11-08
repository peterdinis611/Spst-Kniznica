using BookService.Interfaces;
using BookService.Models;

namespace BookService.DTOs;

public class UpdateBookRequest : IBookRequest
{
    public required string Title { get; set; }
    public string? Subtitle { get; set; }
    public Guid AuthorId { get; set; }
    public string? Publisher { get; set; }
    public string? Isbn { get; set; }
    public int? PublishedYear { get; set; }
    public string? Language { get; set; }
    public Guid? CategoryId { get; set; }
    public string? Description { get; set; }
    public int? PageCount { get; set; }
    public BookFormat Format { get; set; } = BookFormat.Paperback;
    public string? ShelfLocation { get; set; }
    public int TotalCopies { get; set; } = 1;
    public int AvailableCopies { get; set; } = 1;
}

using BookService.Models;

namespace BookService.Interfaces;

public interface IBookRequest
{
    string Title { get; }
    string? Subtitle { get; }
    string Author { get; }
    string? Publisher { get; }
    string? Isbn { get; }
    int? PublishedYear { get; }
    string? Language { get; }
    string? Category { get; }
    string? Description { get; }
    int? PageCount { get; }
    BookFormat Format { get; }
    string? ShelfLocation { get; }
    int TotalCopies { get; }
    int AvailableCopies { get; }
}

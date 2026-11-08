using BookService.Models;

namespace BookService.DTOs;

public class BookQueryFilter
{
    public string? Title { get; set; }
    public string? Author { get; set; }
    public string? Publisher { get; set; }
    public string? Isbn { get; set; }
    public string? Language { get; set; }
    public string? Category { get; set; }
    public string? ShelfLocation { get; set; }
    public int? PublishedYear { get; set; }
    public int? PublishedYearFrom { get; set; }
    public int? PublishedYearTo { get; set; }
    public BookFormat? Format { get; set; }
    public bool? AvailableOnly { get; set; }
    public string? Search { get; set; }
}

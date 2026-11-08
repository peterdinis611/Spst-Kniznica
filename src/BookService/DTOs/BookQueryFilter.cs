using BookService.Models;
using SpstKniznica.Common.Pagination;

namespace BookService.DTOs;

public class BookQueryFilter : PagedQuery
{
    public BookQueryFilter()
    {
        SortBy = "title";
    }

    public string? Title { get; set; }
    public Guid? AuthorId { get; set; }
    public string? Author { get; set; }
    public string? Publisher { get; set; }
    public string? Isbn { get; set; }
    public string? Language { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? ShelfLocation { get; set; }
    public int? PublishedYear { get; set; }
    public int? PublishedYearFrom { get; set; }
    public int? PublishedYearTo { get; set; }
    public BookFormat? Format { get; set; }
    public bool? AvailableOnly { get; set; }
    public string? InventoryNumber { get; set; }
    public string? Barcode { get; set; }
}

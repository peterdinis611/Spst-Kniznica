using BookService.Models;

namespace BookService.DTOs;

/// <summary>Desk / scanner lookup result for a single physical copy.</summary>
public class BookCopyLookupDto
{
    public Guid CopyId { get; set; }
    public Guid BookId { get; set; }
    public string InventoryNumber { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public BookCopyStatus Status { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string BookAuthor { get; set; } = string.Empty;
}
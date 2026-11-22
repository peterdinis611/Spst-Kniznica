namespace BookService.Models;

public class BookCopy
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public Book Book { get; set; } = null!;
    public required string InventoryNumber { get; set; }
    public string? Barcode { get; set; }
    public BookCopyStatus Status { get; set; } = BookCopyStatus.Available;
    public string? ShelfLocation { get; set; }
    /// <summary>
    /// Incremented on every status write. Two staff saves of the same snapshot cannot both succeed.
    /// </summary>
    public uint Version { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

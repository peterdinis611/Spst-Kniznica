using BookService.Models;

namespace BookService.DTOs;

public class UpdateBookCopyStatusRequest
{
    /// <summary>
    /// Nullable so a missing JSON field is rejected. A non-nullable enum would deserialize as Available.
    /// </summary>
    public BookCopyStatus? Status { get; set; }
}

public class UpdateBookCopyStatusResult
{
    public BookCopyDto Copy { get; set; } = null!;
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
}
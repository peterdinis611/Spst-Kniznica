using BookService.Models;

namespace BookService.DTOs;

public class UpdateBookCopyStatusRequest
{
    public BookCopyStatus Status { get; set; }
}

public class UpdateBookCopyStatusResult
{
    public BookCopyDto Copy { get; set; } = null!;
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
}
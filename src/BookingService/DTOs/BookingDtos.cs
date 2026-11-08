using BookingService.Models;
using SpstKniznica.Common.Pagination;

namespace BookingService.DTOs;

public class BookingDto
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public Guid? BookCopyId { get; set; }
    public string BorrowerName { get; set; } = string.Empty;
    public string BorrowerEmail { get; set; } = string.Empty;
    public BookingStatus Status { get; set; }
    public DateTimeOffset ReservedAt { get; set; }
    public DateTimeOffset? BorrowedAt { get; set; }
    public DateTimeOffset DueDate { get; set; }
    public DateTimeOffset? ReturnedAt { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public interface IBookingRequest
{
    Guid BookId { get; }
    Guid? BookCopyId { get; }
    string BorrowerName { get; }
    string BorrowerEmail { get; }
    BookingStatus Status { get; }
    DateTimeOffset DueDate { get; }
    string? Notes { get; }
}

public class CreateBookingRequest : IBookingRequest
{
    public Guid BookId { get; set; }
    public Guid? BookCopyId { get; set; }
    public required string BorrowerName { get; set; }
    public required string BorrowerEmail { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Reserved;
    public DateTimeOffset DueDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateBookingRequest : IBookingRequest
{
    public Guid BookId { get; set; }
    public Guid? BookCopyId { get; set; }
    public required string BorrowerName { get; set; }
    public required string BorrowerEmail { get; set; }
    public BookingStatus Status { get; set; }
    public DateTimeOffset DueDate { get; set; }
    public string? Notes { get; set; }
}

public class BookingQueryFilter : PagedQuery
{
    public BookingQueryFilter()
    {
        SortBy = "dueDate";
    }

    public Guid? BookId { get; set; }
    public Guid? BookCopyId { get; set; }
    public string? BorrowerEmail { get; set; }
    public BookingStatus? Status { get; set; }
}

namespace BookingService.Models;

public class Booking
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public Guid? BookCopyId { get; set; }
    public required string BorrowerName { get; set; }
    public required string BorrowerEmail { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Reserved;
    public DateTimeOffset ReservedAt { get; set; }
    public DateTimeOffset? BorrowedAt { get; set; }
    public DateTimeOffset DueDate { get; set; }
    public DateTimeOffset? ReturnedAt { get; set; }
    public string? Notes { get; set; }
    public int RenewalCount { get; set; }
    public DateTimeOffset? LastReminderAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

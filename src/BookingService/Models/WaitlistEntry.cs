namespace BookingService.Models;

public class WaitlistEntry
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public string BorrowerName { get; set; } = string.Empty;
    public string BorrowerEmail { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public string? Notes { get; set; }
}

namespace BookingService.Models;

public class FavoriteBook
{
    public Guid Id { get; set; }
    public string OwnerEmail { get; set; } = string.Empty;
    public Guid BookId { get; set; }
    public string ListName { get; set; } = "Obľúbené";
    public DateTimeOffset CreatedAt { get; set; }
}

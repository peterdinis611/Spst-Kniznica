namespace MessagingService.Models;

public class AuthorProjection
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Nationality { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset UpdatedAt { get; set; }
    public ICollection<BookProjection> Books { get; set; } = new List<BookProjection>();
}

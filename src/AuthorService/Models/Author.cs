namespace AuthorService.Models;

public class Author
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Biography { get; set; }
    public string? Nationality { get; set; }
    public int? BirthYear { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

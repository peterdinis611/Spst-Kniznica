namespace MessagingService.Models;

public class BookProjection
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Author { get; set; }
    public string? Isbn { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public CategoryProjection? Category { get; set; }
}

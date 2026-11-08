namespace BookService.Models;

public class Book
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Author { get; set; }
    public string? Isbn { get; set; }
    public int? PublishedYear { get; set; }
}

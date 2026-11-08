namespace BookService.DTOs;

public class UpdateBookRequest
{
    public required string Title { get; set; }
    public required string Author { get; set; }
    public string? Isbn { get; set; }
    public int? PublishedYear { get; set; }
}

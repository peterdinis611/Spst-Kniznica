namespace MessagingService.DTOs;

public class CategoryRelationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int BookCount { get; set; }
}

public class AuthorRelationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Nationality { get; set; }
    public bool IsActive { get; set; }
    public int BookCount { get; set; }
}

public class BookRelationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid? AuthorId { get; set; }
    public string Author { get; set; } = string.Empty;
    public string? Isbn { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
}

public class RelationSummaryDto
{
    public int CategoryCount { get; set; }
    public int AuthorCount { get; set; }
    public int BookCount { get; set; }
    public int LinkedBookCount { get; set; }
    public int UnlinkedBookCount { get; set; }
}

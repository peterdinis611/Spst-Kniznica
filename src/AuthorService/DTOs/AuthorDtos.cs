using SpstKniznica.Common.Pagination;

namespace AuthorService.DTOs;

public class AuthorDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Biography { get; set; }
    public string? Nationality { get; set; }
    public int? BirthYear { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public interface IAuthorRequest
{
    string Name { get; }
    string? Biography { get; }
    string? Nationality { get; }
    int? BirthYear { get; }
    bool IsActive { get; }
}

public class CreateAuthorRequest : IAuthorRequest
{
    public required string Name { get; set; }
    public string? Biography { get; set; }
    public string? Nationality { get; set; }
    public int? BirthYear { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateAuthorRequest : IAuthorRequest
{
    public required string Name { get; set; }
    public string? Biography { get; set; }
    public string? Nationality { get; set; }
    public int? BirthYear { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AuthorQueryFilter : PagedQuery
{
    public AuthorQueryFilter()
    {
        SortBy = "name";
    }

    public string? Name { get; set; }
    public string? Nationality { get; set; }
    public bool? IsActive { get; set; }
}
